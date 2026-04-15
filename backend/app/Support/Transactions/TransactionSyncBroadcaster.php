<?php

namespace App\Support\Transactions;

use App\Enums\UserRole;
use App\Events\TransactionChanged;
use App\Events\TransactionRemarkChanged;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;

class TransactionSyncBroadcaster
{
    public function transactionChanged(
        ImportTransaction|ExportTransaction $transaction,
        User $actor,
        string $eventType,
        ?int $previousAssignedUserId = null,
    ): void {
        if (! config('transactions.realtime_enabled')) {
            return;
        }

        event(
            (new TransactionChanged(
                channels: $this->channelsFor($transaction, $previousAssignedUserId),
                payload: $this->payloadFor($transaction, $actor, $eventType),
            ))->dontBroadcastToCurrentUser()
        );
    }

    public function remarkChanged(
        ImportTransaction|ExportTransaction $transaction,
        User $actor,
        string $eventType,
    ): void {
        if (! config('transactions.realtime_enabled')) {
            return;
        }

        event(
            (new TransactionRemarkChanged(
                channels: $this->channelsFor($transaction),
                payload: $this->payloadFor($transaction, $actor, $eventType),
            ))->dontBroadcastToCurrentUser()
        );
    }

    /**
     * @return array<int, PrivateChannel>
     */
    private function channelsFor(
        ImportTransaction|ExportTransaction $transaction,
        ?int $previousAssignedUserId = null,
    ): array {
        $recipientIds = User::query()
            ->whereIn('role', [
                UserRole::Admin->value,
                UserRole::Encoder->value,
                UserRole::Processor->value,
                UserRole::Accounting->value,
            ])
            ->where('is_active', true)
            ->pluck('id')
            ->push($transaction->assigned_user_id)
            ->push($previousAssignedUserId)
            ->filter(fn (?int $id): bool => $id !== null)
            ->unique()
            ->values();

        $channels = $recipientIds
            ->map(fn (int $userId): PrivateChannel => new PrivateChannel("transactions.user.{$userId}"))
            ->all();

        $channels[] = new PrivateChannel(sprintf(
            'transactions.%s.%d',
            $this->transactionTypeFor($transaction),
            $transaction->getKey(),
        ));

        return $channels;
    }

    /**
     * @return array<string, bool|int|null|string>
     */
    private function payloadFor(
        ImportTransaction|ExportTransaction $transaction,
        User $actor,
        string $eventType,
    ): array {
        return [
            'event_type' => $eventType,
            'transaction_type' => $this->transactionTypeFor($transaction),
            'transaction_id' => $transaction->getKey(),
            'reference' => $this->referenceFor($transaction),
            'status' => $this->statusFor($transaction),
            'is_archive' => (bool) $transaction->is_archive,
            'assigned_user_id' => $transaction->assigned_user_id,
            'actor_id' => $actor->getKey(),
            'occurred_at' => now()->toISOString(),
        ];
    }

    private function transactionTypeFor(ImportTransaction|ExportTransaction $transaction): string
    {
        return $transaction instanceof ImportTransaction ? 'import' : 'export';
    }

    private function referenceFor(ImportTransaction|ExportTransaction $transaction): string
    {
        if ($transaction instanceof ImportTransaction) {
            return $transaction->customs_ref_no
                ?: 'IMP-'.str_pad((string) $transaction->getKey(), 4, '0', STR_PAD_LEFT);
        }

        return 'EXP-'.str_pad((string) $transaction->getKey(), 4, '0', STR_PAD_LEFT);
    }

    private function statusFor(ImportTransaction|ExportTransaction $transaction): string
    {
        return is_string($transaction->status) ? $transaction->status : $transaction->status->value;
    }
}
