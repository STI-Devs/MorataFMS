import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionSyncProvider } from './context/TransactionSyncContext';
import { AuthProvider, GuestRoute, ProtectedRoute, useAuth } from './features/auth';
import { isAdmin } from './features/auth/utils/access';
import { appRoutes } from './lib/appRoutes';
import {
  AdminDashboard,
  AdminDocumentReview,
  AdminLiveTracking,
  AccountantDashboard,
  AccountantDocumentsPage,
  AccountantImpExpPage,
  AuditLogs,
  AuthPage,
  ClientManagement,
  CountryManagement,
  Documents,
  DocumentDetailBridge,
  DocumentGeneratorPage,
  EncoderArchivePage,
  EncoderDashboard,
  EncoderReportsAnalytics,
  ExportList,
  Help,
  ImportList,
  LegalArchivePage,
  LegalArchiveRecordsPage,
  LegalFileMasterSetupPage,
  LegacyRecordsPage,
  LandingPage,
  LegalMasterSetupPage,
  NotarialGeneratedDocumentsPage,
  LocationOfGoodsManagement,
  LawFirmPage,
  NotarialGeneratedDocumentEditorPage,
  ParalegalDashboard,
  Profile,
  ProcessorDashboard,
  ProcessorDocumentsPage,
  ProcessorTransactionPage,
  RecordsPage,
  ReportsAnalytics,
  TrackingDashboard,
  TrackingDetails,
  TransactionOversight,
  UserManagement,
} from './lib/lazyPages';
import { MainLayout } from './components/layout/MainLayout';
import NotFoundPage from './pages/NotFoundPage';
import ServiceUnavailablePage from './pages/ServiceUnavailablePage';

const RootFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-6">
        <div className="flex items-center gap-3 text-sm font-semibold text-text-muted">
            <div className="w-5 h-5 rounded-full border-2 border-text-muted/30 border-t-text-muted animate-spin" />
            Loading...
        </div>
    </div>
);

function DocumentsIndexRoute() {
  const { user } = useAuth();

  if (isAdmin(user)) {
    return <Navigate to={appRoutes.adminDocumentReview} replace />;
  }

  return <Documents />;
}

function AppContent() {
  const { bootstrapError, isLoading, retryBootstrap } = useAuth();

  if (isLoading) {
    return <RootFallback />;
  }

  if (bootstrapError === 'service-unavailable') {
    return <ServiceUnavailablePage onRetry={() => void retryBootstrap()} />;
  }

  return (
    <Suspense fallback={<RootFallback />}>
      <Routes>
        {/* Public landing page */}
        <Route path={appRoutes.landing} element={<LandingPage />} />

        {/* Guest-only routes */}
        <Route element={<GuestRoute />}>
          <Route path={appRoutes.login} element={<AuthPage />} />
        </Route>

        {/* All authenticated users */}
        <Route element={<ProtectedRoute allowedRoles={['encoder', 'admin', 'paralegal', 'processor', 'accounting']} />}>
          <Route element={<MainLayout />}>

            {/* Shared routes — all authenticated roles */}
            <Route path={appRoutes.profile} element={<Profile />} />
            <Route path={appRoutes.help} element={<Help />} />

            {/* Brokerage module — encoder + admin only */}
            <Route element={<ProtectedRoute allowedRoles={['encoder', 'admin']} />}>
              <Route path={appRoutes.tracking} element={<TrackingDashboard />} />
              <Route path={appRoutes.trackingDetail} element={<TrackingDetails />} />
              <Route path={appRoutes.imports} element={<ImportList />} />
              <Route path={appRoutes.exports} element={<ExportList />} />
              <Route path={appRoutes.exportAlias} element={<ExportList />} />
              <Route path={appRoutes.documents} element={<DocumentsIndexRoute />} />
              <Route path={appRoutes.documentDetail} element={<DocumentDetailBridge />} />
            </Route>

            {/* Encoder-only brokerage routes */}
            <Route element={<ProtectedRoute allowedRoles={['encoder']} />}>
              <Route path={appRoutes.encoderDashboard} element={<EncoderDashboard />} />
              <Route path={appRoutes.encoderReportsAnalytics} element={<EncoderReportsAnalytics />} />
              <Route path={appRoutes.myArchive} element={<Navigate to={appRoutes.encoderRecordsArchive} replace />} />
              <Route path={appRoutes.encoderRecords} element={<Navigate to={appRoutes.encoderRecordsArchive} replace />} />
              <Route path={appRoutes.encoderRecordsWildcard} element={<EncoderArchivePage />} />
            </Route>

            {/* Admin-only brokerage routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path={appRoutes.dashboard} element={<AdminDashboard />} />
              <Route path={appRoutes.adminDocumentReview} element={<AdminDocumentReview />} />
              <Route path={appRoutes.users} element={<UserManagement />} />
              <Route path={appRoutes.clients} element={<ClientManagement />} />
              <Route path={appRoutes.countries} element={<CountryManagement />} />
              <Route path={appRoutes.locationsOfGoods} element={<LocationOfGoodsManagement />} />
              <Route path={appRoutes.transactions} element={<TransactionOversight />} />
              <Route path={appRoutes.reports} element={<ReportsAnalytics />} />
              <Route path={appRoutes.auditLogs} element={<AuditLogs />} />
              <Route path={appRoutes.archives} element={<Navigate to={appRoutes.archiveTransactions} replace />} />
              <Route path={appRoutes.archivesWildcard} element={<RecordsPage />} />
            </Route>

            {/* Legal module - admin + paralegal */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'paralegal']} />}>
              <Route path={appRoutes.paralegalDashboard} element={<ParalegalDashboard />} />
              <Route path={appRoutes.paralegalLegacyRecords} element={<Navigate to={appRoutes.paralegalLegacyFolderUpload} replace />} />
              <Route path={appRoutes.paralegalLegacyBatches} element={<Navigate to={appRoutes.paralegalLegacyNotarialBatches} replace />} />
              <Route path={appRoutes.paralegalLegacyRecordsWildcard} element={<LegacyRecordsPage />} />
              <Route path={appRoutes.lawFirm} element={<LawFirmPage />} />
              <Route path={appRoutes.forms} element={<Navigate to={appRoutes.paralegalGenerator} replace />} />
              <Route path={appRoutes.paralegalDocuments} element={<Navigate to={appRoutes.paralegalGenerator} replace />} />
              <Route path={appRoutes.paralegalNotarialIndex} element={<Navigate to={appRoutes.paralegalGenerator} replace />} />
              <Route path={appRoutes.paralegalLegalFilesIndex} element={<Navigate to={appRoutes.paralegalLegalFiles} replace />} />
              <Route path={appRoutes.paralegalGenerator} element={<DocumentGeneratorPage />} />
              <Route path={appRoutes.paralegalMasterSetup} element={<LegalMasterSetupPage />} />
              <Route path={appRoutes.paralegalNotarialLegacyFolderUpload} element={<Navigate to={appRoutes.paralegalLegacyFolderUpload} replace />} />
              <Route path={appRoutes.paralegalNotarialLegacyBatches} element={<Navigate to={appRoutes.paralegalLegacyNotarialBatches} replace />} />
              <Route path={appRoutes.paralegalLegalFiles} element={<LegalArchivePage />} />
              <Route path={appRoutes.paralegalLegalFileMasters} element={<LegalFileMasterSetupPage />} />
              <Route path={appRoutes.paralegalLegalFileRecords} element={<LegalArchiveRecordsPage />} />
              <Route path={appRoutes.paralegalLegalLegacyFolderUpload} element={<Navigate to={appRoutes.paralegalLegacyFolderUpload} replace />} />
              <Route path={appRoutes.paralegalLegalLegacyBatches} element={<Navigate to={appRoutes.paralegalLegacyLegalBatches} replace />} />
              <Route path={appRoutes.paralegalGeneratedDocuments} element={<NotarialGeneratedDocumentsPage />} />
            </Route>

            {/* Processor module */}
            <Route element={<ProtectedRoute allowedRoles={['processor']} />}>
              <Route path={appRoutes.processorDashboard} element={<ProcessorDashboard />} />
              <Route path={appRoutes.processorTransaction} element={<ProcessorTransactionPage />} />
              <Route path={appRoutes.processorDocuments} element={<ProcessorDocumentsPage />} />
            </Route>

            {/* Accounting module */}
            <Route element={<ProtectedRoute allowedRoles={['accounting']} />}>
              <Route path={appRoutes.accountantDashboard} element={<AccountantDashboard />} />
              <Route path={appRoutes.accountantImpExp} element={<AccountantImpExpPage />} />
              <Route path={appRoutes.accountantDocuments} element={<AccountantDocumentsPage />} />
            </Route>

          </Route>

          {/* Standalone admin: no sidebar */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path={appRoutes.liveTracking} element={<AdminLiveTracking />} />
          </Route>

          {/* Standalone legal editor: no sidebar */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'paralegal']} />}>
            <Route path={appRoutes.paralegalGeneratedDocumentEditor} element={<NotarialGeneratedDocumentEditorPage />} />
            <Route path={appRoutes.paralegalLegalGeneratedDocumentEditor} element={<NotarialGeneratedDocumentEditorPage />} />
          </Route>
        </Route>

        {/* Redirect /admin to /dashboard */}
        <Route path={appRoutes.adminAlias} element={<Navigate to={appRoutes.dashboard} replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TransactionSyncProvider>
          <Toaster richColors position="top-right" />
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </TransactionSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
