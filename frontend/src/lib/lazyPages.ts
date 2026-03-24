import { lazy } from 'react';

export const AdminDashboard = lazy(() =>
    import('../features/admin-dashboard/components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })),
);

export const ArchivesPage = lazy(() =>
    import('../features/archives/components/ArchivesPage').then((module) => ({ default: module.ArchivesPage })),
);

export const EncoderArchivePage = lazy(() =>
    import('../features/archives/components/EncoderArchivePage').then((module) => ({ default: module.EncoderArchivePage })),
);

export const AuditLogs = lazy(() =>
    import('../features/audit-logs/components/AuditLogs').then((module) => ({ default: module.AuditLogs })),
);

export const AuthPage = lazy(() =>
    import('../features/auth/components/AuthPage').then((module) => ({ default: module.AuthPage })),
);

export const ClientManagement = lazy(() =>
    import('../features/clients/components/ClientManagement').then((module) => ({ default: module.ClientManagement })),
);

export const Documents = lazy(() =>
    import('../features/documents/components/Documents').then((module) => ({ default: module.Documents })),
);

export const DocumentsDetail = lazy(() =>
    import('../features/documents/components/DocumentsDetail').then((module) => ({ default: module.DocumentsDetail })),
);

export const FormsPage = lazy(() =>
    import('../features/forms/components/FormsPage').then((module) => ({ default: module.FormsPage })),
);

export const LawFirmPage = lazy(() =>
    import('../features/law-firm/components/LawFirmPage').then((module) => ({ default: module.LawFirmPage })),
);

export const TransactionOversight = lazy(() =>
    import('../features/oversight/components/TransactionOversight').then((module) => ({ default: module.TransactionOversight })),
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
    import('../features/tracking/components/AdminLiveTracking').then((module) => ({ default: module.AdminLiveTracking })),
);

export const ExportList = lazy(() =>
    import('../features/tracking/components/ExportList').then((module) => ({ default: module.ExportList })),
);

export const ImportList = lazy(() =>
    import('../features/tracking/components/ImportList').then((module) => ({ default: module.ImportList })),
);

export const TrackingDashboard = lazy(() =>
    import('../features/tracking/components/dashboard/TrackingDashboard').then((module) => ({ default: module.TrackingDashboard })),
);

export const TrackingDetails = lazy(() =>
    import('../features/tracking/components/TrackingDetails').then((module) => ({ default: module.TrackingDetails })),
);

export const UserManagement = lazy(() =>
    import('../features/users/components/UserManagement').then((module) => ({ default: module.UserManagement })),
);

export const LandingPage = lazy(() => import('../pages/LandingPage'));
