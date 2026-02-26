import { useNavigate } from 'react-router-dom';
import { ErrorLayout } from './ErrorLayout';

/**
 * Full-page 404 error screen.
 * Shown when a user navigates to a URL that doesn't match any route.
 */
export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <ErrorLayout
            code="404"
            title="Lost Cargo"
            message="We couldn't find the page or shipment you're looking for."
            action={{
                label: 'Go to Dashboard',
                onClick: () => navigate('/dashboard'),
            }}
        />
    );
}
