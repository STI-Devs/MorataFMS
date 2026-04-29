import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { StageRow } from './StageRow';

describe('StageRow', () => {
    it('disables the N/A toggle when the stage is still blocked by earlier stages', () => {
        renderWithProviders(
            <StageRow
                stage={{
                    title: 'DCCCI Printing',
                    description: 'Print documents from DCCCI for export compliance.',
                    icon: 'file-text',
                    type: 'dccci',
                    supportsNotApplicable: true,
                }}
                index={0}
                isLast={false}
                stageStatus="pending"
                docs={[]}
                isNotApplicable={false}
                isUploading={false}
                isApplicabilityUpdating={false}
                deletingDocId={null}
                uploadDisabledReason="Complete the earlier required stages before uploading this document."
                onUploadClick={vi.fn()}
                onPreviewDoc={vi.fn()}
                onDeleteDoc={vi.fn()}
                onReplaceDoc={vi.fn()}
                onNotApplicableChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('allows toggling N/A when the optional stage is currently available', () => {
        const onNotApplicableChange = vi.fn();

        renderWithProviders(
            <StageRow
                stage={{
                    title: 'CO Application',
                    description: 'Apply for the Certificate of Origin when required.',
                    icon: 'check-circle',
                    type: 'co',
                    supportsNotApplicable: true,
                }}
                index={0}
                isLast={false}
                stageStatus="active"
                docs={[]}
                isNotApplicable={false}
                isUploading={false}
                isApplicabilityUpdating={false}
                deletingDocId={null}
                uploadDisabledReason={null}
                onUploadClick={vi.fn()}
                onPreviewDoc={vi.fn()}
                onDeleteDoc={vi.fn()}
                onReplaceDoc={vi.fn()}
                onNotApplicableChange={onNotApplicableChange}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(onNotApplicableChange).toHaveBeenCalledWith('co', true);
    });
});
