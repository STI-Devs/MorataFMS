import { lazy } from 'react';

export const AdminDashboard = lazy(() =>
    import('../features/admin-dashboard/components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })),
);

export const AdminDocumentReview = lazy(() =>
    import('../features/documents/components/admin-review/AdminDocumentReview').then((module) => ({ default: module.AdminDocumentReview })),
);

export const ArchivesPage = lazy(() =>
    import('../features/archives/components/pages/ArchivesPage').then((module) => ({ default: module.ArchivesPage })),
);

export const RecordsPage = lazy(() =>
    import('../features/archives/components/pages/RecordsPage').then((module) => ({ default: module.RecordsPage })),
);


export const AccountantDashboard = lazy(() =>
    import('../features/accounting-dashboard/components/AccountingDashboard').then((module) => ({ default: module.AccountingDashboard })),
);

export const AccountantDocumentsPage = lazy(() =>
    import('../features/accounting-dashboard/components/AccountingDocumentsPage').then((module) => ({ default: module.AccountingDocumentsPage })),
);

export const AccountantImpExpPage = lazy(() =>
    import('../features/accounting-dashboard/components/AccountingImpExpPage').then((module) => ({ default: module.AccountingImpExpPage })),
);

export const EncoderArchivePage = lazy(() =>
    import('../features/archives/components/pages/EncoderArchivePage').then((module) => ({ default: module.EncoderArchivePage })),
);

export const EncoderDashboard = lazy(() =>
    import('../features/encoder-dashboard/components/EncoderDashboard').then((module) => ({ default: module.EncoderDashboard })),
);

export const AuditLogs = lazy(() =>
    import('../features/audit-logs/components/AuditLogs').then((module) => ({ default: module.AuditLogs })),
);

export const AuthPage = lazy(() =>
    import('../features/auth/components/login/AuthPage').then((module) => ({ default: module.AuthPage })),
);

export const ClientManagement = lazy(() =>
    import('../features/clients/components/ClientManagement').then((module) => ({ default: module.ClientManagement })),
);

export const CountryManagement = lazy(() =>
    import('../features/countries/components/CountryManagement').then((module) => ({ default: module.CountryManagement })),
);

export const LocationOfGoodsManagement = lazy(() =>
    import('../features/locations-of-goods/components/LocationOfGoodsManagement').then((module) => ({ default: module.LocationOfGoodsManagement })),
);

export const Documents = lazy(() =>
    import('../features/documents/components/document-list/Documents').then((module) => ({ default: module.Documents })),
);

export const DocumentsDetail = lazy(() =>
    import('../features/documents/components/DocumentsDetail').then((module) => ({ default: module.DocumentsDetail })),
);

export const LawFirmPage = lazy(() =>
    import('../features/law-firm/components/pages/LawFirmPage').then((module) => ({ default: module.LawFirmPage })),
);

export const LegalDocumentsPage = lazy(() =>
    import('../features/law-firm/components/records/LegalDocumentsPage').then((module) => ({ default: module.LegalDocumentsPage })),
);

export const NotarialTemplateUploadPage = lazy(() =>
    import('../features/law-firm/components/notarial/NotarialTemplateUploadPage').then((module) => ({ default: module.NotarialTemplateUploadPage })),
);

export const NotarialBooksPage = lazy(() =>
    import('../features/law-firm/components/notarial/NotarialBooksPage').then((module) => ({ default: module.NotarialBooksPage })),
);

export const LegalArchivePage = lazy(() =>
    import('../features/law-firm/components/archive/LegalArchivePage').then((module) => ({ default: module.LegalArchivePage })),
);

export const LegalArchiveRecordsPage = lazy(() =>
    import('../features/law-firm/components/archive/LegalArchiveRecordsPage').then((module) => ({ default: module.LegalArchiveRecordsPage })),
);

export const LegalRecordsPage = lazy(() =>
    import('../features/law-firm/components/records/LegalRecordsPage').then((module) => ({ default: module.LegalRecordsPage })),
);

export const ParalegalDashboard = lazy(() =>
    import('../features/law-firm/components/pages/ParalegalDashboard').then((module) => ({ default: module.ParalegalDashboard })),
);

export const ProcessorDashboard = lazy(() =>
    import('../features/processor-dashboard/components/ProcessorDashboard').then((module) => ({ default: module.ProcessorDashboard })),
);

export const ProcessorDocumentsPage = lazy(() =>
    import('../features/processor-dashboard/components/ProcessorDocumentsPage').then((module) => ({ default: module.ProcessorDocumentsPage })),
);

export const ProcessorTransactionPage = lazy(() =>
    import('../features/processor-dashboard/components/ProcessorTransactionPage').then((module) => ({ default: module.ProcessorTransactionPage })),
);

export const TransactionOversight = lazy(() =>
    import('../features/oversight/components/pages/TransactionOversight').then((module) => ({ default: module.TransactionOversight })),
);

export const ReportsAnalytics = lazy(() =>
    import('../features/reports/components/ReportsAnalytics').then((module) => ({ default: module.ReportsAnalytics })),
);

export const Help = lazy(() =>
    import('../features/settings/components/Help').then((module) => ({ default: module.Help })),
);

export const Profile = lazy(() =>
    import('../features/settings/components/Profile').then((module) => ({ default: module.Profile })),
);

export const AdminLiveTracking = lazy(() =>
    import('../features/tracking/components/pages/AdminLiveTracking').then((module) => ({ default: module.AdminLiveTracking })),
);

export const ExportList = lazy(() =>
    import('../features/tracking/components/lists/ExportList').then((module) => ({ default: module.ExportList })),
);

export const ImportList = lazy(() =>
    import('../features/tracking/components/lists/ImportList').then((module) => ({ default: module.ImportList })),
);

export const TrackingDashboard = lazy(() =>
    import('../features/tracking/components/dashboard/TrackingDashboard').then((module) => ({ default: module.TrackingDashboard })),
);

export const TrackingDetails = lazy(() =>
    import('../features/tracking/components/details/TrackingDetails').then((module) => ({ default: module.TrackingDetails })),
);

export const UserManagement = lazy(() =>
    import('../features/users/components/UserManagement').then((module) => ({ default: module.UserManagement })),
);

export const LandingPage = lazy(() => import('../pages/LandingPage'));
