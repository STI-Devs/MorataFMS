import type { IconName } from '../../../components/Icon';
import type { ApiExportStages, ApiImportStages } from '../types';

type StageStatusKey = keyof ApiImportStages | keyof ApiExportStages;
type StageStatusMap = Partial<Record<StageStatusKey, string>>;

export interface StageDefinition {
    title:       string;
    icon:        IconName;
    description: string;
    type:        string;
    supportsNotApplicable?: boolean;
}

export const IMPORT_STAGES: StageDefinition[] = [
    { title: 'BOC Document Processing',  icon: 'file-text',    description: 'Submit and process customs declaration at the Bureau of Customs.',    type: 'boc' },
    { title: 'BONDS',                    icon: 'check-circle', description: 'Process customs bonds when the shipment requires them.',               type: 'bonds', supportsNotApplicable: true },
    { title: 'Payment for PPA Charges',  icon: 'truck',        description: 'Settle port and pier authority charges.',                              type: 'ppa', supportsNotApplicable: true },
    { title: 'Delivery Order Request',   icon: 'file-text',    description: 'Request delivery order from the shipping line or agent.',             type: 'do' },
    { title: 'Payment for Port Charges', icon: 'file-text',    description: 'Pay remaining port storage and handling fees.',                       type: 'port_charges', supportsNotApplicable: true },
    { title: 'Releasing of Documents',   icon: 'check-circle', description: 'Collect released documents from customs and shipping line.',          type: 'releasing' },
    { title: 'Liquidation and Billing',  icon: 'file-text',    description: 'Finalize billing and liquidate all charges with the client.',         type: 'billing' },
];

export const EXPORT_STAGES: StageDefinition[] = [
    { title: 'BOC Document Processing',    icon: 'file-text',    description: 'Submit export declaration at the Bureau of Customs.',             type: 'boc' },
    { title: 'Bill of Lading',             icon: 'file-text',    description: 'Coordinate with the shipping line to issue the Bill of Lading.',  type: 'bl_generation' },
    { title: 'Phytosanitary Certificates', icon: 'file-text',    description: 'Prepare phytosanitary certificates for export shipments.',        type: 'phytosanitary', supportsNotApplicable: true },
    { title: 'CO Application',             icon: 'check-circle', description: 'Apply for the Certificate of Origin when required.',              type: 'co', supportsNotApplicable: true },
    { title: 'CIL',                        icon: 'file-text',    description: 'Certificate of Inspection and Loading for export release.',       type: 'cil' },
    { title: 'DCCCI Printing',             icon: 'file-text',    description: 'Print documents from DCCCI for export compliance.',                type: 'dccci', supportsNotApplicable: true },
    { title: 'Billing of Liquidation',     icon: 'file-text',    description: 'Finalize billing and close out the export transaction.',           type: 'billing' },
];

/**
 * Derives stage visual state purely from whether a document exists for that stage.
 * Replaces the old status-string-based approach which was not reactive to uploads.
 *
 * @param hasDoc       - Whether this stage has an uploaded document
 * @param isFirstEmpty - Whether this is the first stage without a document (= active/in-progress)
 */
export function getStageStatusFromDoc(
    hasDoc: boolean,
    isFirstEmpty: boolean,
): 'completed' | 'active' | 'pending' {
    if (hasDoc) return 'completed';
    if (isFirstEmpty) return 'active';
    return 'pending';
}

export function getOperationalStageStatus(
    hasDoc: boolean,
    isActionable: boolean,
): 'completed' | 'active' | 'pending' {
    if (hasDoc) {
        return 'completed';
    }

    return isActionable ? 'active' : 'pending';
}

export function isStageCompleted(status?: string): boolean {
    return status === 'completed';
}

export function getWaitingAgeLabel(dateString: string | null | undefined, now = Date.now()): string | null {
    if (! dateString) {
        return null;
    }

    const createdAt = new Date(dateString).getTime();

    if (Number.isNaN(createdAt)) {
        return null;
    }

    const diffMs = Math.max(0, now - createdAt);
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (totalHours < 1) {
        return 'Waiting <1 hour';
    }

    if (totalHours < 24) {
        return `Waiting ${totalHours} hour${totalHours === 1 ? '' : 's'}`;
    }

    const totalDays = Math.floor(totalHours / 24);

    return `Waiting ${totalDays} day${totalDays === 1 ? '' : 's'}`;
}

function areStagesCompleted(
    stages: StageStatusMap | undefined,
    requiredStages: StageStatusKey[],
): boolean {
    if (!stages) {
        return false;
    }

    return requiredStages.every((stage) => isStageCompleted(stages[stage]));
}

function getFirstIncompletePrerequisite(
    stages: StageStatusMap | undefined,
    prerequisites: StageStatusKey[],
    stageDefinitions: StageDefinition[],
): string | null {
    if (! stages) {
        return null;
    }

    const stageLabels = Object.fromEntries(stageDefinitions.map((stage) => [stage.type, stage.title])) as Record<string, string>;
    const blockedStage = prerequisites.find((stage) => ! isStageCompleted(stages[stage]));

    return blockedStage ? stageLabels[blockedStage] ?? blockedStage : null;
}

export function getImportProcessorActionability(stages?: StageStatusMap): Record<'ppa' | 'port_charges', boolean> {
    return {
        ppa: areStagesCompleted(stages, ['boc', 'bonds']) && !isStageCompleted(stages?.ppa),
        port_charges: areStagesCompleted(stages, ['boc', 'bonds', 'ppa', 'do']) && !isStageCompleted(stages?.port_charges),
    };
}

export function getExportProcessorActionability(stages?: StageStatusMap): Record<'cil' | 'dccci', boolean> {
    return {
        cil: areStagesCompleted(stages, ['boc', 'bl_generation', 'phytosanitary', 'co']) && !isStageCompleted(stages?.cil),
        dccci: areStagesCompleted(stages, ['boc', 'bl_generation', 'phytosanitary', 'co', 'cil']) && !isStageCompleted(stages?.dccci),
    };
}

export function getImportAccountingActionability(stages?: StageStatusMap): Record<'billing', boolean> {
    return {
        billing: areStagesCompleted(stages, ['boc', 'bonds', 'ppa', 'do', 'port_charges', 'releasing']) && !isStageCompleted(stages?.billing),
    };
}

export function getExportAccountingActionability(stages?: StageStatusMap): Record<'billing', boolean> {
    return {
        billing: areStagesCompleted(stages, ['boc', 'bl_generation', 'phytosanitary', 'co', 'cil', 'dccci']) && !isStageCompleted(stages?.billing),
    };
}

export function getImportProcessorWaitingReason(stages?: StageStatusMap): string | null {
    if (! stages) {
        return 'Waiting for encoder progress.';
    }

    if (! isStageCompleted(stages.ppa)) {
        const blocker = getFirstIncompletePrerequisite(stages, ['boc', 'bonds'], IMPORT_STAGES);

        return blocker ? `Waiting for ${blocker}.` : null;
    }

    if (! isStageCompleted(stages.port_charges)) {
        const blocker = getFirstIncompletePrerequisite(stages, ['boc', 'bonds', 'ppa', 'do'], IMPORT_STAGES);

        return blocker ? `Waiting for ${blocker}.` : null;
    }

    return null;
}

export function getExportProcessorWaitingReason(stages?: StageStatusMap): string | null {
    if (! stages) {
        return 'Waiting for encoder progress.';
    }

    if (! isStageCompleted(stages.cil)) {
        const blocker = getFirstIncompletePrerequisite(stages, ['boc', 'bl_generation', 'phytosanitary', 'co'], EXPORT_STAGES);

        return blocker ? `Waiting for ${blocker}.` : null;
    }

    if (! isStageCompleted(stages.dccci)) {
        const blocker = getFirstIncompletePrerequisite(stages, ['boc', 'bl_generation', 'phytosanitary', 'co', 'cil'], EXPORT_STAGES);

        return blocker ? `Waiting for ${blocker}.` : null;
    }

    return null;
}

export function getImportAccountingWaitingReason(stages?: StageStatusMap): string | null {
    if (! stages) {
        return 'Waiting for encoder and processor progress.';
    }

    if (isStageCompleted(stages.billing)) {
        return null;
    }

    const blocker = getFirstIncompletePrerequisite(
        stages,
        ['boc', 'bonds', 'ppa', 'do', 'port_charges', 'releasing'],
        IMPORT_STAGES,
    );

    return blocker ? `Waiting for ${blocker}.` : null;
}

export function getExportAccountingWaitingReason(stages?: StageStatusMap): string | null {
    if (! stages) {
        return 'Waiting for encoder and processor progress.';
    }

    if (isStageCompleted(stages.billing)) {
        return null;
    }

    const blocker = getFirstIncompletePrerequisite(
        stages,
        ['boc', 'bl_generation', 'phytosanitary', 'co', 'cil', 'dccci'],
        EXPORT_STAGES,
    );

    return blocker ? `Waiting for ${blocker}.` : null;
}

/** @deprecated Use getStageStatusFromDoc. Kept for backward compatibility. */
export function getStageStatus(index: number, status: string): 'completed' | 'active' | 'pending' {
    if (status === 'Cleared' || status === 'Shipped' || status === 'Completed') return 'completed';
    if (status === 'In Transit') {
        if (index < 3) return 'completed';
        if (index === 3) return 'active';
    }
    if (status === 'Pending' || status === 'Processing') {
        if (index === 0) return 'active';
    }
    return 'pending';
}

export function getStatusStyle(status: string): { color: string; bg: string } {
    switch (status) {
        case 'Cleared':
        case 'Shipped':
        case 'completed':
        case 'Completed':      return { color: '#30d158', bg: 'rgba(48,209,88,0.13)' };
        case 'Vessel Arrived': return { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' };
        case 'In Transit':     return { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' };
        case 'Departure':      return { color: '#bf5af2', bg: 'rgba(191,90,242,0.13)' };
        case 'in_progress':
        case 'Processing':
        case 'pending':
        case 'Pending':        return { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' };
        case 'cancelled':
        case 'Cancelled':      return { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' };
        default:               return { color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' };
    }
}

/**
 * Derives a human-readable import status label from the set of uploaded stage types.
 * Used by the UI badge so it reflects document state without waiting for a DB status update.
 *
 * Import ladder:
 *   No stages → Pending → BOC → Vessel Arrived → Bonds/PPA/DO/Port/Releasing → Processing → Billing → Completed
 */
export function getImportDisplayStatus(uploadedStages: string[]): string {
    if (uploadedStages.includes('billing')) {
        return 'Completed';
    }
    if (uploadedStages.some((stage) => ['bonds', 'ppa', 'do', 'port_charges', 'releasing'].includes(stage))) {
        return 'Processing';
    }
    if (uploadedStages.includes('boc')) {
        return 'Vessel Arrived';
    }

    return 'Pending';
}

/**
 * Derives a human-readable export status label from the set of uploaded stage types.
 *
 * Export ladder:
 *   No stages → Pending → BOC → In Transit → BL → Departure → CO/Phyto/DCCCI → Processing → Billing → Completed
 */
export function getExportDisplayStatus(uploadedStages: string[]): string {
    if (uploadedStages.includes('billing')) {
        return 'Completed';
    }
    if (uploadedStages.some((stage) => ['phytosanitary', 'co', 'cil', 'dccci'].includes(stage))) {
        return 'Processing';
    }
    if (uploadedStages.includes('bl_generation')) {
        return 'Departure';
    }
    if (uploadedStages.includes('boc')) {
        return 'In Transit';
    }

    return 'Pending';
}
