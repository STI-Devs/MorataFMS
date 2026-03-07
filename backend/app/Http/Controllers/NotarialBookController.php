<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotarialBookRequest;
use App\Http\Resources\NotarialBookResource;
use App\Models\NotarialBook;
use Illuminate\Http\Request;

class NotarialBookController extends Controller
{
    /**
     * List all notarial books, ordered by year desc then book_number desc.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', NotarialBook::class);

        $query = NotarialBook::with('createdBy')
            ->orderByDesc('year')
            ->orderByDesc('book_number');

        // Optional filters
        if ($request->filled('year')) {
            $query->where('year', $request->input('year'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $books = $query->paginate($request->input('per_page', 15));

        return NotarialBookResource::collection($books);
    }

    /**
     * Show a single book.
     */
    public function show(NotarialBook $book)
    {
        $this->authorize('view', $book);

        $book->load('createdBy');

        return new NotarialBookResource($book);
    }

    /**
     * Create a new notarial book.
     */
    public function store(StoreNotarialBookRequest $request)
    {
        $this->authorize('create', NotarialBook::class);

        // Only one active book at a time
        $activeBook = NotarialBook::where('status', 'active')->first();
        if ($activeBook) {
            return response()->json([
                'message' => 'There is already an active book (Book ' . $activeBook->book_number . ', ' . $activeBook->year . '). Please close or archive it first.',
            ], 422);
        }

        $book = new NotarialBook($request->validated());
        $book->status = 'active';
        $book->entries_count = 0;
        $book->opened_at = now();
        $book->created_by = $request->user()->id;
        $book->save();

        $book->load('createdBy');

        return new NotarialBookResource($book);
    }

    /**
     * Update a book (e.g., archive it, close it).
     */
    public function update(Request $request, NotarialBook $book)
    {
        $this->authorize('update', $book);

        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:active,full,archived'],
        ]);

        if (isset($validated['status'])) {
            // If setting to active, check no other active book exists
            if ($validated['status'] === 'active') {
                $activeBook = NotarialBook::where('status', 'active')
                    ->where('id', '!=', $book->id)
                    ->first();
                if ($activeBook) {
                    return response()->json([
                        'message' => 'Another book is already active. Close it first.',
                    ], 422);
                }
            }

            $book->status = $validated['status'];

            // Auto-set closed_at when archiving or marking as full
            if (in_array($validated['status'], ['full', 'archived']) && !$book->closed_at) {
                $book->closed_at = now();
            }

            // Clear closed_at if re-activating
            if ($validated['status'] === 'active') {
                $book->closed_at = null;
            }
        }

        $book->save();
        $book->load('createdBy');

        return new NotarialBookResource($book);
    }

    /**
     * Delete a book (admin only, should be rare).
     */
    public function destroy(NotarialBook $book)
    {
        $this->authorize('delete', $book);

        $book->delete();

        return response()->json(['message' => 'Book deleted.'], 200);
    }

    /**
     * Per-book report/summary.
     */
    public function report(NotarialBook $book)
    {
        $this->authorize('view', $book);

        $entries = $book->entries()->with('client')->get();

        $totalFees = $entries->sum('notary_fee');
        $typeBreakdown = $entries->groupBy('document_type')->map->count();
        $clientBreakdown = $entries->groupBy('client.name')->map->count();

        return response()->json([
            'book' => new NotarialBookResource($book),
            'summary' => [
                'total_entries' => $entries->count(),
                'total_fees' => $totalFees,
                'capacity' => 525,
                'remaining' => 525 - $entries->count(),
                'document_types' => $typeBreakdown,
                'clients' => $clientBreakdown,
            ],
        ]);
    }
}
