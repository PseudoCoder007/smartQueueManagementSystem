import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  message: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: '' };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message || 'The frontend failed to render.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Frontend render error', error, info);
  }

  render() {
    if (this.state.message) {
      return (
        <main className="auth-page">
          <div className="auth-panel">
            <h1>Something went wrong</h1>
            <p className="error-text">{this.state.message}</p>
            <button type="button" onClick={() => {
              localStorage.removeItem('smartqueue.session');
              window.location.assign('/login');
            }}>
              Reset session
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
