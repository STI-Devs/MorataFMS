# Phase 8 — Overlay Migration to Radix (HIGHEST blast radius — do LAST)

**Goal:** replace the 4 hand-rolled overlays (no Esc/focus-trap/scroll-lock/aria) with Radix-backed primitives while keeping **exported props byte-identical** so every call site stays untouched and the 6 mock-double feature tests keep passing.

**Status:** ✅ complete (2026-08-28) — O8.1–O8.6 applied (O8.7 no-change); overlay lock tests green, all 6 mock-double feature suites pass unchanged, full gate (lint/test/build/smoke) green.

## Prerequisite

Phase 0 test-lock FIRST (T0.6): write direct component tests for UploadModal/ConfirmationModal/FilePreviewModal/ActionMenu + useConfirmationModal. These lock the current behavior; the migration must keep them green.

## Tasks

- [x] **O8.1 — `components/ui/dialog.tsx`**: add optional `overlayClassName?: string` prop threaded into `DialogOverlay` (default = current shadcn look untouched; RemarkModal/StatusOverrideModal unaffected).
- [x] **O8.2 — `components/ui/alert-dialog.tsx`**: same optional `overlayClassName` prop.
- [x] **O8.3 — `components/modals/UploadModal.tsx`** → Dialog
  - Keep `UploadModalProps` EXACTLY: `isOpen, onClose, onUpload, title, isLoading, errorMessage, contextContent, submitLabel`.
  - `<Dialog open={isOpen} onOpenChange={o => !o && onClose()}>` → `<DialogContent className="z-[150] w-full max-w-md p-0 gap-0 border-0 bg-transparent shadow-none sm:max-w-md" overlayClassName="bg-black/40 backdrop-blur-sm z-[150] animate-backdrop-in" showCloseButton={false} onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>` (suppress outside-close — current behavior: backdrop click does nothing) → **inner panel** `<div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-modal-in">` holding the unchanged header/body/footer.
  - `h3` header → `DialogTitle` (visible); sr-only `DialogDescription`; custom X → `DialogClose`.
  - Add reset effect: `useEffect(() => { if (!isOpen) { setSelectedFiles([]); setSelectionError(null); setIsDragging(false); } }, [isOpen])` (Radix keeps it mounted; current `if (!isOpen) return null` unmount-reset is lost otherwise).
  - Keep all selection/drag/upload handlers byte-identical.
- [x] **O8.4 — `components/modals/FilePreviewModal.tsx`** → Dialog
  - Keep props EXACTLY: `isOpen, onClose, file, fileName, onDownload`.
  - `DialogContent className="z-[200] w-full max-w-4xl h-[100dvh] p-0 gap-0 border-0 bg-transparent shadow-none sm:h-auto sm:max-w-4xl" overlayClassName="bg-black/80 backdrop-blur-sm z-[200] animate-backdrop-in" showCloseButton={false}` → inner panel `flex h-full flex-col overflow-hidden rounded-none bg-surface sm:h-auto sm:max-h-[92vh] sm:rounded-2xl border-border border shadow-2xl`. Full-bleed on phones, centered max-w-4xl on desktop (NOT a Sheet/vaul — vaul not installed).
  - Keep default outside-click close (matches current overlay onClick). Compute `URL.createObjectURL` only while open (component now stays mounted).
- [x] **O8.5 — `components/ConfirmationModal.tsx`** → AlertDialog
  - Keep props EXACTLY: `isOpen, onClose, onConfirm, title, message, confirmText, confirmButtonClass, cancelText, hideCancel, icon`.
  - `<AlertDialog open={isOpen} onOpenChange={o => { if (!o && !isProcessing) onClose(); }}>` → `AlertDialogContent className="z-[200] w-full max-w-sm p-0 gap-0 border-0 bg-transparent shadow-none sm:max-w-sm" overlayClassName="bg-black/40 backdrop-blur-sm z-[200] animate-backdrop-in"` → inner `<div className="p-6 text-center bg-surface rounded-2xl border border-border shadow-2xl animate-modal-in">`.
  - title→`AlertDialogTitle`, message→`AlertDialogDescription`; icon circle kept.
  - `AlertDialogAction` with `confirmButtonClass` + `onClick={handleConfirm}` AND `onSelect={e => e.preventDefault()}` (stays open through async), then `handleConfirm` calls `onClose` after await → preserves Processing... state. `AlertDialogCancel` disabled while processing. `hideCancel` → single full-width Action.
- [x] **O8.6 — `components/ActionMenu.tsx`** → DropdownMenu (0 call sites, dead code — free win)
  - Preserve `ActionMenuItem` interface (label/icon/onClick/variant/hidden) + `{ items }` props. `DropdownMenuTrigger` button `aria-haspopup="menu"`; `DropdownMenuContent align="end" class="z-50 w-44 overflow-hidden rounded-lg border … animate-dropdown-in"`; normal items + `DropdownMenuSeparator` + destructive items. Delete manual mousedown/keydown/menuRef (~25 lines).
- [x] **O8.7 — `hooks/useConfirmationModal.ts`**: NO code change (shape `{ isOpen, closeModal, openModal, modalProps }` stays — 4 management pages spread `{...modalProps}`).

## Test locks turned green

- [ ] T0.6 direct tests (UploadModal, FilePreviewModal, ConfirmationModal, ActionMenu, useConfirmationModal).
- [ ] NEW a11y locks after migration: body scroll locked while open + restored after (incl. nested Sheet+Dialog in ProcessorUploadModal); Esc closes.
- [ ] KEEP unchanged (mock-double implicit contract locks — they assert the prop names): AccountingUploadModal.test, AccountingImpExpPage.test, ProcessorUploadModal.test, DocumentDetailPane.test, TrackingDetails.test, TransactionDetailDrawer.test.

## Risk notes (behavior deltas to watch)

- **Esc now closes** UploadModal/ConfirmationModal/FilePreviewModal (was only ActionMenu) — desired a11y gain, user-visible.
- **Outside-close**: Dialog closes on backdrop by default — MUST suppress on UploadModal/ConfirmationModal (AlertDialog refuses natively); FilePreviewModal keeps default.
- **Async confirm ordering**: `onSelect={e => e.preventDefault()}` on the Action is the ONLY way to keep the dialog open through `await onConfirm()`.
- **animate-modal-in transform** (fill-mode both) clobbers Radix `translate-[-50%]` centering → the animation + panel visuals go on an INNER wrapper, Radix content stays a transparent positioning shell. Do NOT swap to shadcn `data-[state=open]:animate-in` (different easing).
- **z-index**: UploadModal content/overlay `z-[150]`; FilePreview/Confirmation `z-[200]`. Nested Dialog-over-Sheet (ProcessorUploadModal, TransactionDetailDrawer) paints above via portal document order — smoke-test the stacking.
- **ScrollLock**: Radix (react-remove-scroll) locks body while open; never hand-roll body overflow. Verify no double-lock residue after nested close.
- Adds one dependency-surface note: vaul NOT installed → no Drawer; FilePreviewModal stays a Dialog.

## Gate

- [ ] `cd frontend && pnpm test` (full suite — the 6 mock-double tests must pass unmodified) + `pnpm lint` + `pnpm build`.
- [ ] Full `pnpm smoke`.
- [ ] Manual: ProcessorUploadModal + TransactionDetailDrawer nested Sheet→overlay smoke; Esc/backdrop behavior per modal; focus trap cycles inside, returns to trigger; same visuals (size/radius/shadow/dark tokens + animate-modal-in ease).