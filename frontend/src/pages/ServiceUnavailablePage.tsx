import { ErrorLayout } from '../components/layout/ErrorLayout';

type ServiceUnavailablePageProps = {
    onRetry: () => void;
};

export default function ServiceUnavailablePage({ onRetry }: ServiceUnavailablePageProps) {
    return (
        <ErrorLayout
            code="503"
            title="Service Unavailable"
            message="MorataFMS can't reach the backend right now. This is a system issue, not a login issue. Please try again in a moment."
            action={{
                label: 'Retry Connection',
                onClick: onRetry,
            }}
        />
    );
}
