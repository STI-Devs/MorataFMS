import type { IconName } from '../../../components/Icon';


export interface StageDefinition {
    title:       string;
    icon:        IconName;
    description: string;
    type:        string;
}

export const IMPORT_STAGES: StageDefinition[] = [
    { title: 'BOC Document Processing',  icon: 'file-text',    description: 'Submit and process customs declaration at the Bureau of Customs.',    type: 'boc' },
    { title: 'Payment for PPA Charges',  icon: 'truck',        description: 'Settle port and pier authority charges.',                              type: 'ppa' },
    { title: 'Delivery Order Request',   icon: 'file-text',    description: 'Request delivery order from the shipping line or agent.',             type: 'do' },
    { title: 'Payment for Port Charges', icon: 'file-text',    description: 'Pay remaining port storage and handling fees.',                       type: 'port_charges' },
    { title: 'Releasing of Documents',   icon: 'check-circle', description: 'Collect released documents from customs and shipping line.',          type: 'releasing' },
    { title: 'Liquidation and Billing',  icon: 'file-text',    description: 'Finalize billing and liquidate all charges with the client.',         type: 'billing' },
];

export const EXPORT_STAGES: StageDefinition[] = [
    { title: 'BOC Document Processing',    icon: 'file-text',    description: 'Submit export declaration at the Bureau of Customs.',             type: 'boc' },
    { title: 'Bill of Lading Generation',  icon: 'file-text',    description: 'Coordinate with shipping line to issue the Bill of Lading.',      type: 'bl_generation' },
    { title: 'CO Application & Releasing', icon: 'check-circle', description: 'Apply for and receive Certificate of Origin.',                    type: 'co' },
    { title: 'DCCCI Printing',             icon: 'file-text',    description: 'Print documents from DCCCI for export compliance.',                type: 'dccci' },
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
 * Derives a human-readable import status label from the set of uploaded document types.
 * Used by the UI badge so it reflects document state without waiting for a DB status update.
 *
 * Import ladder:
 *   No docs → Pending → BOC → Vessel Arrived → PPA/DO/Port/Releasing → Processing → Billing → Completed
 */
export function getImportDisplayStatus(docTypes: string[]): string {
    if (docTypes.includes('billing'))                                                 return 'Completed';
    if (docTypes.some(t => ['ppa', 'do', 'port_charges', 'releasing'].includes(t))) return 'Processing';
    if (docTypes.includes('boc'))                                                     return 'Vessel Arrived';
    return 'Pending';
}

/**
 * Derives a human-readable export status label from the set of uploaded document types.
 *
 * Export ladder:
 *   No docs → Pending → BOC → In Transit → BL → Departure → CO/DCCCI → Processing → Billing → Completed
 */
export function getExportDisplayStatus(docTypes: string[]): string {
    if (docTypes.includes('billing'))                              return 'Completed';
    if (docTypes.some(t => ['co', 'dccci'].includes(t)))          return 'Processing';
    if (docTypes.includes('bl_generation'))                        return 'Departure';
    if (docTypes.includes('boc'))                                  return 'In Transit';
    return 'Pending';
}

