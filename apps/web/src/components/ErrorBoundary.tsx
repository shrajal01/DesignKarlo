import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DesignKarlo ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border-4 border-black bg-red-50 p-6 md:p-8 shadow-neo-lg flex flex-col gap-4 my-6">
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            <div className="w-10 h-10 bg-red-600 border-2 border-black shadow-neo-sm flex items-center justify-center text-white font-black text-lg">
              !
            </div>
            <div>
              <h3 className="font-black text-base md:text-lg text-red-950 uppercase tracking-tight">
                {this.props.fallbackTitle || 'Editor Rendering Error'}
              </h3>
              <p className="text-xs font-bold text-red-800">
                The interface encountered an unexpected rendering error. Your session data is intact.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="bg-white border-2 border-black p-3 font-mono text-xs text-red-900 break-words flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{this.state.error.message}</span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="neo-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Editor View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
