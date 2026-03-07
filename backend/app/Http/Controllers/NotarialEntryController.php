<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotarialEntryRequest;
use App\Http\Requests\UpdateNotarialEntryRequest;
use App\Http\Resources\NotarialEntryResource;
use App\Models\NotarialBook;
use App\Models\NotarialEntry;
use Illuminate\Http\Request;

class NotarialEntryController extends Controller
{
    /**
     * List entries for a book.
     */
    public function index(Request $request, NotarialBook $book)
    {
        $this->authorize('viewAny', NotarialEntry::class);

        $query = $book->entries()
            ->with(['client', 'createdBy'])
            ->withCount('documents');

        // Search by client name or doc number
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('doc_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('signer_names', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by document type
        if ($request->filled('document_type')) {
            $query->where('document_type', $request->input('document_type'));
        }

        // Sort
        $sortBy = $request->input('sort_by', 'doc_number');
        $sortDir = $request->input('sort_dir', 'asc');
        $allowedSorts = ['doc_number', 'notarized_at', 'title', 'notary_fee', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $entries = $query->paginate($request->input('per_page', 25));

        return NotarialEntryResource::collection($entries);
    }

    /**
     * Show a single entry.
     */
    public function show(NotarialBook $book, NotarialEntry $entry)
    {
        $this->authorize('view', $entry);

        $entry->load(['client', 'createdBy', 'book', 'documents']);

        return new NotarialEntryResource($entry);
    }

    /**
     * Create a new entry in a book.
     */
    public function store(StoreNotarialEntryRequest $request, NotarialBook $book)
    {
        $this->authorize('create', NotarialEntry::class);

        // Check if book is full
        if ($book->isFull()) {
            return response()->json([
                'message' => 'This book is full (525 entries). Please create a new book.',
            ], 422);
        }

        // Check book is active
        if ($book->status !== 'active') {
            return response()->json([
                'message' => 'Cannot add entries to a ' . $book->status . ' book.',
            ], 422);
        }

        $entry = new NotarialEntry($request->validated());
        $entry->notarial_book_id = $book->id;
        $entry->created_by = $request->user()->id;
        $entry->save();

        // Increment the book's entries counter
        $book->increment('entries_count');

        // Auto-close book if it just hit 525
        if ($book->fresh()->isFull()) {
            $book->update([
                'status' => 'full',
                'closed_at' => now(),
            ]);
        }

        $entry->load(['client', 'createdBy']);

        return new NotarialEntryResource($entry);
    }

    /**
     * Update an entry.
     */
    public function update(UpdateNotarialEntryRequest $request, NotarialBook $book, NotarialEntry $entry)
    {
        $this->authorize('update', $entry);

        $entry->fill($request->validated());
        $entry->save();

        $entry->load(['client', 'createdBy', 'book']);

        return new NotarialEntryResource($entry);
    }

    /**
     * Delete an entry.
     */
    public function destroy(NotarialBook $book, NotarialEntry $entry)
    {
        $this->authorize('delete', $entry);

        $entry->delete();

        // Decrement the book's entries counter
        $book->decrement('entries_count');

        // If book was full and we removed an entry, it could be re-activated
        // But we leave that as a manual action — admin can update status

        return response()->json(['message' => 'Entry deleted.'], 200);
    }
}
