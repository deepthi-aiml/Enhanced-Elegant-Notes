import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center min-h-[300px]">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Something went wrong</h3>
                        <p className="text-muted-foreground max-w-md">
                            An error occurred while rendering this component. You can try refreshing the page or clicking the button below.
                        </p>
                    </div>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Reload Page
                    </Button>
                    <Button onClick={this.handleReset} variant="ghost" className="text-xs">
                        Try again without reloading
                    </Button>
                    {process.env.NODE_ENV === "development" && (
                        <pre className="mt-4 p-4 bg-muted rounded text-left text-xs overflow-auto max-w-full">
                            {this.state.error?.message}
                            {"\n"}
                            {this.state.error?.stack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
