import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log to console in development
        // if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by boundary:', error, errorInfo);
        // }

        // Store error info for potential reporting
        this.setState({
            error,
            errorInfo
        });

        // TODO: Send to error reporting service in production
        // Example: Sentry.captureException(error);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            // const isDev = process.env.NODE_ENV === 'development';
            const isDev = true; // For demonstration purposes, set to true. Replace with actual env check.

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                                Something went wrong
                            </h1>

                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                We're sorry, but something unexpected happened. Please try reloading the page.
                            </p>

                            {/* Show technical details only in development */}
                            {isDev && this.state.error && (
                                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                    <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                                                Stack trace
                                            </summary>
                                            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium px-6 py-3 rounded-lg transition-colors"
                                >
                                    Go to Dashboard
                                </button>
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>

                            {!isDev && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
                                    If this problem persists, please contact support.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;