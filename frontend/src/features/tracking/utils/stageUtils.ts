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


export function getStageStatus(index: number, status: string): 'completed' | 'active' | 'pending' {
    if (status === 'Cleared' || status === 'Shipped') return 'completed';
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
    if (status === 'Cleared' || status === 'Shipped')   return { color: '#30d158', bg: 'rgba(48,209,88,0.13)' };
    if (status === 'Pending' || status === 'Processing') return { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' };
    if (status === 'In Transit')                         return { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' };
    if (status === 'Cancelled')                          return { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' };
    return { color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' };
}
