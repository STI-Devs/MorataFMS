import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import type { ArchiveDocument } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import { ReplaceArchiveDocumentModal } from './ReplaceArchiveDocumentModal';

vi.mock('../../tracking/api/trackingApi');

const createWrapper = () => {
    const queryClient = new QueryClient();
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('ReplaceArchiveDocumentModal', () => {
    const mockDocument = {
        id: 1,
        transaction_id: 1,
        documentable_type: 'App\\Models\\ImportTransaction',
        filename: 'old-invoice.pdf',
        size_bytes: 1024,
        formatted_size: '1 KB',
        type: 'import',
        stage: 'boc',
        not_applicable_stages: [],
        uploader: {
            id: 1, name: 'John Doe', 
        },
    } as unknown as ArchiveDocument;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        render(
            <ReplaceArchiveDocumentModal
                isOpen={false}
                onClose={() => {}}
                document={mockDocument}
            />,
            { wrapper: createWrapper() },
        );
        expect(screen.queryByText('Replace File')).not.toBeInTheDocument();
    });

    it('renders and shows current document info', () => {
        render(
            <ReplaceArchiveDocumentModal
                isOpen={true}
                onClose={() => {}}
                document={mockDocument}
            />,
            { wrapper: createWrapper() },
        );
        expect(screen.getByText('old-invoice.pdf')).toBeInTheDocument();
        expect(screen.getByText('Boc')).toBeInTheDocument();
    });

    it('disables submit until a valid file is selected', () => {
        render(
            <ReplaceArchiveDocumentModal
                isOpen={true}
                onClose={() => {}}
                document={mockDocument}
            />,
            { wrapper: createWrapper() },
        );

        const submitBtn = screen.getByRole('button', { name: /Replace File/i });
        expect(submitBtn).toBeDisabled();

        const fileInput = screen.getByLabelText(/Choose new file/i);
        const file = new File(['dummy content'], 'new.pdf', { type: 'application/pdf' });

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(submitBtn).not.toBeDisabled();
    });

    it('calls replaceDocument and closes on success', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(trackingApi.replaceDocument).mockResolvedValueOnce({} as any);
        const onClose = vi.fn();

        render(
            <ReplaceArchiveDocumentModal
                isOpen={true}
                onClose={onClose}
                document={mockDocument}
            />,
            { wrapper: createWrapper() },
        );

        const fileInput = screen.getByLabelText(/Choose new file/i);
        const file = new File(['dummy content'], 'new.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        const submitBtn = screen.getByRole('button', { name: /Replace File/i });
        fireEvent.click(submitBtn);

        expect(submitBtn).toBeDisabled();
        expect(screen.getByText(/Replacing.../i)).toBeInTheDocument();

        await waitFor(() => {
            expect(trackingApi.replaceDocument).toHaveBeenCalledWith(1, file);
        });
        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('displays error message on failed upload', async () => {
        vi.mocked(trackingApi.replaceDocument).mockRejectedValueOnce({
            response: { data: { message: 'Invalid file format' } },
        });

        render(
            <ReplaceArchiveDocumentModal
                isOpen={true}
                onClose={() => {}}
                document={mockDocument}
            />,
            { wrapper: createWrapper() },
        );

        const fileInput = screen.getByLabelText(/Choose new file/i);
        const file = new File(['dummy content'], 'new.pdf', { type: 'application/pdf' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        const submitBtn = screen.getByRole('button', { name: /Replace File/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Invalid file format')).toBeInTheDocument();
        });
    });

    it('blocks files larger than 20MB before replace', () => {
        render(
            <ReplaceArchiveDocumentModal
                isOpen={true}
                onClose={() => {}}
                document={mockDocument}
            />,
            { wrapper: createWrapper() },
        );

        const fileInput = screen.getByLabelText(/Choose new file/i);
        const largeFile = new File([new Uint8Array(1)], 'too-large.pdf', { type: 'application/pdf' });
        Object.defineProperty(largeFile, 'size', { value: 21 * 1024 * 1024 });

        fireEvent.change(fileInput, { target: { files: [largeFile] } });

        expect(screen.getByText('Each file must be 20MB or less.')).toBeInTheDocument();
        expect(trackingApi.replaceDocument).not.toHaveBeenCalled();
    });
});
