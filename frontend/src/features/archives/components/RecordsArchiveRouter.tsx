import { useAuth } from '../../auth';
import { ArchivesPage } from './ArchivesPage';
import { EncoderArchivePage } from './EncoderArchivePage';

export const RecordsArchiveRouter = () => {
    const { user } = useAuth();
    if (user?.role === 'admin') {
        return <ArchivesPage />;
    }
    // Fallback or encoder
    return <EncoderArchivePage />;
};
