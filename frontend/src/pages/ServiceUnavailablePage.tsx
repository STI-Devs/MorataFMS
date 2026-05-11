import { ErrorLayout } from '../components/layout/ErrorLayout';

type ServiceUnavailablePageProps = {
    onRetry: () => void;
};

export default function ServiceUnavailablePage({ onRetry }: ServiceUnavailablePageProps) {
    return (
        <ErrorLayout
            code="503"
            title="Service Unavailable"
            message="The service is temporarily unavailable. Please try again in a few moments."
            action={{
                label: 'Try Again',
                onClick: onRetry,
            }}
        />
    );
}
