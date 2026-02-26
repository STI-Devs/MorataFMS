import React from 'react';
import { ErrorLayout } from './layout/ErrorLayout';

interface State {
    hasError: boolean;
}

/**
 * Catches unhandled JS runtime errors during render.
 * Shows a user-friendly 500 page instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Unhandled render error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorLayout
                    code="500"
                    title="Something Went Wrong"
                    message="An unexpected error occurred. Please refresh the page or contact support if the problem persists."
                    action={{
                        label: 'Refresh Page',
                        onClick: () => window.location.reload(),
                    }}
                />
            );
        }
        return this.props.children;
    }
}
