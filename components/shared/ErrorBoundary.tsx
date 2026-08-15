import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { logger } from '../../services/Logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Unhandled UI Exception caught by ErrorBoundary:', { error, errorInfo }, 'ErrorBoundary');
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 m-4 rounded-2xl border border-rose-500/30 bg-slate-900/90 text-center backdrop-blur-md">
          <div className="p-4 mb-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-400 max-w-md mb-4">
            An unexpected error occurred in this section. The application remains safe and functional.
          </p>
          {this.state.error && (
            <div className="p-3 mb-6 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-rose-300 max-w-lg overflow-x-auto text-left w-full">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
