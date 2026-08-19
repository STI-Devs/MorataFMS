import { Navigate, useParams } from 'react-router-dom';
import { appRoutes } from '../../../lib/appRoutes';

/**
 * Bridges the legacy `/documents/:ref` deep link into the master-detail
 * Documents page by redirecting to `/documents?ref=...` (which opens the
 * detail pane pre-selected). Keeps old bookmarks and Tracking links working.
 */
export const DocumentDetailBridge = () => {
    const { ref } = useParams<{ ref: string }>();
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    return <Navigate to={`${appRoutes.documents}${query}`} replace />;
};
