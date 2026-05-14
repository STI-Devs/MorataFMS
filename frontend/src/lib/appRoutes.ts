import type { PermissionMap } from '../types/access';

export const appRoutes = {
    landing: '/',
    login: '/login',
    profile: '/profile',
    help: '/help',
    tracking: '/tracking',
    trackingDetail: '/tracking/:referenceId',
    imports: '/imports',
    exports: '/exports',
    exportAlias: '/export',
    documents: '/documents',
    documentDetail: '/documents/:ref',
    myArchive: '/my-archive',
    encoderRecords: '/records',
    encoderRecordsWildcard: '/records/*',
    encoderRecordsArchive: '/records/archive',
    encoderLegacyFolderUpload: '/records/legacy-folder-upload',
    encoderLegacyBatches: '/records/legacy-batches',
    encoderDashboard: '/encoder',
    encoderReportsAnalytics: '/encoder/reports',
    dashboard: '/dashboard',
    users: '/users',
    clients: '/brokerage-clients',
    countries: '/countries',
    locationsOfGoods: '/locations-of-goods',
    transactions: '/transactions',
    reports: '/reports',
    auditLogs: '/audit-logs',
    archives: '/archives',
    archivesWildcard: '/archives/*',
    archiveTransactions: '/archives/transactions',
    legacyFolderUpload: '/archives/legacy-folder-upload',
    legacyBatches: '/archives/legacy-batches',
    lawFirm: '/law-firm',
    forms: '/forms',
    paralegalDashboard: '/paralegal',
    paralegalDocuments: '/paralegal/documents',
    paralegalLegacyRecords: '/paralegal/legacy-records',
    paralegalLegacyRecordsWildcard: '/paralegal/legacy-records/*',
    paralegalLegacyFolderUpload: '/paralegal/legacy-records/legacy-folder-upload',
    paralegalLegacyBatches: '/paralegal/legacy-records/legacy-batches',
    paralegalLegacyNotarialBatches: '/paralegal/legacy-records/notarial-batches',
    paralegalLegacyLegalBatches: '/paralegal/legacy-records/legal-batches',
    paralegalNotarialIndex: '/paralegal/notarial',
    paralegalGenerator: '/paralegal/notarial/generator',
    paralegalMasterSetup: '/paralegal/notarial/master-setup',
    paralegalNotarialLegacyFolderUpload: '/paralegal/notarial/legacy-folder-upload',
    paralegalNotarialLegacyBatches: '/paralegal/notarial/legacy-batches',
    paralegalLegalFilesIndex: '/paralegal/legal-files',
    paralegalLegalFiles: '/paralegal/legal-files/encode',
    paralegalLegalFileMasters: '/paralegal/legal-files/master-setup',
    paralegalLegalFileRecords: '/paralegal/legal-files/records',
    paralegalLegalGeneratedDocumentEditor: '/paralegal/legal-files/generated-documents/:documentId/edit',
    paralegalLegalLegacyFolderUpload: '/paralegal/legal-files/legacy-folder-upload',
    paralegalLegalLegacyBatches: '/paralegal/legal-files/legacy-batches',
    paralegalGeneratedDocuments: '/paralegal/notarial/generated-documents',
    paralegalGeneratedDocumentEditor: '/paralegal/notarial/generated-documents/:documentId/edit',
    processorDashboard: '/processor',
    processorTransaction: '/processor/transaction',
    processorDocuments: '/processor/documents',
    accountantDashboard: '/accountant',
    accountantImpExp: '/accountant/impexp',
    accountantDocuments: '/accountant/documents',
    liveTracking: '/live-tracking',
    adminDocumentReview: '/admin/document-review',
    adminAlias: '/admin',
} as const;

export type NavigationItem = {
    label: string;
    path: string;
    icon: string;
    newTab?: boolean;
    exact?: boolean;
    badge?: number | string;
    requiredPermission?: keyof PermissionMap;
};

export type LegalNavigationGroup = {
    label: string;
    icon: string;
    items: NavigationItem[];
};

export type NavigationGroup = LegalNavigationGroup;

export const navigationItems: {
    adminBrokerage: NavigationItem[];
    encoderBrokerage: NavigationItem[];
    processor: NavigationItem[];
    accountant: NavigationItem[];
    legal: NavigationItem[];
    settings: NavigationItem[];
} = {
    adminBrokerage: [
        { label: 'Dashboard', path: appRoutes.dashboard, exact: true, icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
        { label: 'Transaction Oversight', path: appRoutes.transactions, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { label: 'Documents', path: appRoutes.adminDocumentReview, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Live Tracking', path: appRoutes.liveTracking, newTab: true, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'User Management', path: appRoutes.users, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { label: 'Brokerage Client Management', path: appRoutes.clients, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { label: 'Country Management', path: appRoutes.countries, icon: 'M3 7l9-4 9 4m-18 0l9 4m-9-4v10l9 4m0-10l9-4m-9 4v10' },
        { label: 'Location of Goods', path: appRoutes.locationsOfGoods, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
        { label: 'Reports & Analytics', path: appRoutes.reports, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { label: 'Audit Logs', path: appRoutes.auditLogs, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    ],
    encoderBrokerage: [
        { label: 'Dashboard', path: appRoutes.encoderDashboard, exact: true, icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
        { label: 'Tracking', path: appRoutes.tracking, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { label: 'Import List', path: appRoutes.imports, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: 'Export List', path: appRoutes.exports, icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
        { label: 'Documents', path: appRoutes.documents, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Reports & Analytics', path: appRoutes.encoderReportsAnalytics, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
    processor: [
        { label: 'Dashboard', path: appRoutes.processorDashboard, exact: true, icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
        { label: 'Transaction', path: appRoutes.processorTransaction, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { label: 'Documents', path: appRoutes.processorDocuments, icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
    ],
    accountant: [
        { label: 'Dashboard', path: appRoutes.accountantDashboard, exact: true, icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
        { label: 'Accounting Tasks', path: appRoutes.accountantImpExp, icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
        { label: 'Documents', path: appRoutes.accountantDocuments, icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
    ],
    legal: [
        { label: 'Dashboard', path: appRoutes.paralegalDashboard, exact: true, icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    ],
    settings: [
        { label: 'Profile', path: appRoutes.profile, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { label: 'Help', path: appRoutes.help, icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
};

export const adminBrokerageGuardPaths = [
    appRoutes.dashboard,
    appRoutes.adminDocumentReview,
    appRoutes.transactions,
    appRoutes.users,
    appRoutes.clients,
    appRoutes.countries,
    appRoutes.locationsOfGoods,
    appRoutes.reports,
    appRoutes.auditLogs,
    appRoutes.archives,
    appRoutes.liveTracking,
];

export const encoderBrokerageGuardPaths = [
    appRoutes.encoderDashboard,
    appRoutes.encoderReportsAnalytics,
    appRoutes.tracking,
    appRoutes.imports,
    appRoutes.exports,
    appRoutes.documents,
    appRoutes.myArchive,
    appRoutes.encoderRecords,
];

export const adminBrokerageNavigationGroups: NavigationGroup[] = [
    {
        label: 'Records',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
        items: [
            { label: 'Records Archive', path: appRoutes.archiveTransactions, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { label: 'Legacy Folder Upload', path: appRoutes.legacyFolderUpload, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12l-4 4m4-4l4 4' },
            { label: 'Legacy Batches', path: appRoutes.legacyBatches, icon: 'M4 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 5h8m-8 4h5' },
        ],
    },
];

export const encoderBrokerageNavigationGroups: NavigationGroup[] = [
    {
        label: 'Records',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
        items: [
            { label: 'Records Archive', path: appRoutes.encoderRecordsArchive, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { label: 'Legacy Folder Upload', path: appRoutes.encoderLegacyFolderUpload, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12l-4 4m4-4l4 4' },
            { label: 'Legacy Batches', path: appRoutes.encoderLegacyBatches, icon: 'M4 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 5h8m-8 4h5' },
        ],
    },
];

export const legalGuardPaths = [
    appRoutes.paralegalDashboard,
    appRoutes.paralegalDocuments,
    appRoutes.paralegalLegacyRecords,
    appRoutes.paralegalLegacyFolderUpload,
    appRoutes.paralegalLegacyBatches,
    appRoutes.paralegalLegacyNotarialBatches,
    appRoutes.paralegalLegacyLegalBatches,
    appRoutes.paralegalNotarialIndex,
    appRoutes.paralegalGenerator,
    appRoutes.paralegalMasterSetup,
    appRoutes.paralegalNotarialLegacyFolderUpload,
    appRoutes.paralegalNotarialLegacyBatches,
    appRoutes.paralegalLegalFilesIndex,
    appRoutes.paralegalLegalFiles,
    appRoutes.paralegalLegalFileMasters,
    appRoutes.paralegalLegalFileRecords,
    appRoutes.paralegalLegalGeneratedDocumentEditor,
    appRoutes.paralegalLegalLegacyFolderUpload,
    appRoutes.paralegalLegalLegacyBatches,
    appRoutes.paralegalGeneratedDocuments,
    appRoutes.paralegalGeneratedDocumentEditor,
    appRoutes.lawFirm,
    appRoutes.forms,
];

export const legalNavigationGroups: LegalNavigationGroup[] = [
    {
        label: 'Notarial Documents',
        icon: 'M3 6h18M7 3v6m10-6v6M6 11h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z',
        items: [
            { label: 'Create Draft', path: appRoutes.paralegalGenerator, icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
            { label: 'Document Masters', path: appRoutes.paralegalMasterSetup, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12l-4 4m4-4l4 4', requiredPermission: 'manage_notarial_templates' },
            { label: 'Generated Documents', path: appRoutes.paralegalGeneratedDocuments, icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
        ],
    },
    {
        label: 'Legal Files',
        icon: 'M5 4h10l4 4v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm9 1.5V9h3.5',
        items: [
            { label: 'Create Draft', path: appRoutes.paralegalLegalFiles, icon: 'M4 7a2 2 0 012-2h7l5 5v7a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm8-1v4h4' },
            { label: 'Document Masters', path: appRoutes.paralegalLegalFileMasters, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12l-4 4m4-4l4 4' },
            { label: 'Generated Documents', path: appRoutes.paralegalLegalFileRecords, icon: 'M4 6a2 2 0 012-2h8l6 6v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm4 7h8m-8 4h8' },
        ],
    },
    {
        label: 'Legacy Records',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
        items: [
            { label: 'Legacy Folder Upload', path: appRoutes.paralegalLegacyFolderUpload, icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12l-4 4m4-4l4 4' },
            { label: 'Notarial Batches', path: appRoutes.paralegalLegacyNotarialBatches, icon: 'M4 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 5h8m-8 4h5' },
            { label: 'Legal Batches', path: appRoutes.paralegalLegacyLegalBatches, icon: 'M4 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 5h8m-8 4h5' },
        ],
    },
];

export const processorGuardPaths = [
    appRoutes.processorDashboard,
    appRoutes.processorTransaction,
    appRoutes.processorDocuments,
];

export const accountantGuardPaths = [
    appRoutes.accountantDashboard,
    appRoutes.accountantImpExp,
    appRoutes.accountantDocuments,
];

export const adminDashboardQuickLinks = [
    { label: 'Documents', path: appRoutes.adminDocumentReview, color: '#0a84ff', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Live Tracking', path: appRoutes.liveTracking, color: '#64d2ff', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'User Management', path: appRoutes.users, color: '#bf5af2', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Brokerage Client Management', path: appRoutes.clients, color: '#0a84ff', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Transaction Oversight', path: appRoutes.transactions, color: '#30d158', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Reports & Analytics', path: appRoutes.reports, color: '#ff9f0a', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Audit Logs', path: appRoutes.auditLogs, color: '#ff453a', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
];
