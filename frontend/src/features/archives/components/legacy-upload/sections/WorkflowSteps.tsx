import type { UploadPhase } from '../../../utils/legacyUpload.utils';
import { semanticToneClasses } from './legacyUploadStyles';

export const WorkflowSteps = ({ phase }: { phase: UploadPhase }) => {
    const activeIndex =
        phase === 'empty' ? 1
            : phase === 'selected' ? 2
                : phase === 'uploading' ? 3
                    : 3;

    const steps = [
        {
            title: 'Select root folder',
            description: 'Start from the same top-level folder the staff already recognizes from the client archive.',
        },
        {
            title: 'Review preflight',
            description: 'Confirm the detected hierarchy and required metadata before the batch is created.',
        },
        {
            title: 'Upload batch',
            description: 'Upload the preserved hierarchy and keep progress resumable at the file level.',
        },
    ];

    return (
        <div className="grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => {
                const stepIndex = index + 1;
                const isActive = activeIndex === stepIndex;
                const isComplete = activeIndex > stepIndex;

                return (
                    <div
                        key={step.title}
                        className={`rounded-xl border px-4 py-4 ${
                            isActive
                                ? semanticToneClasses.info
                                : isComplete
                                    ? semanticToneClasses.good
                                    : 'border-border bg-surface'
                        }`}
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-black ${
                                    isActive
                                        ? 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
                                        : isComplete
                                            ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-200'
                                            : 'border-border-strong bg-surface-secondary text-text-muted'
                                }`}
                            >
                                {stepIndex}
                            </span>
                            <p className="text-sm font-bold text-text-primary">{step.title}</p>
                        </div>
                        <p className="text-xs leading-relaxed text-text-muted">{step.description}</p>
                    </div>
                );
            })}
        </div>
    );
};
