import React from 'react';

const areResetKeysEqual = (prevResetKeys = [], nextResetKeys = []) => {
  if (prevResetKeys.length !== nextResetKeys.length) return false;
  return prevResetKeys.every((key, index) => Object.is(key, nextResetKeys[index]));
};

export const DefaultErrorFallback = ({ onRetry, title }) => (
  <div className="w-full min-h-[220px] flex items-center justify-center px-4 py-8">
    <div className="max-w-md text-center rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-black font-semibold text-lg">{title || 'Something went wrong'}</p>
      <p className="mt-2 text-sm text-black/60">
        We could not render this part of the page. Your other content is still available.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:opacity-85 transition-opacity"
      >
        Retry
      </button>
    </div>
  </div>
);

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    const { onError, boundaryName } = this.props;
    const context = boundaryName ? `Error in ${boundaryName}` : 'UI rendering error';
    console.error(context, error, errorInfo);
    if (typeof onError === 'function') {
      onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps) {
    const { hasError } = this.state;
    const { resetKeys = [] } = this.props;
    if (!hasError) return;

    if (!areResetKeysEqual(prevProps.resetKeys || [], resetKeys)) {
      this.reset();
    }
  }

  reset = () => {
    const { onReset } = this.props;
    if (typeof onReset === 'function') {
      onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender, fallbackTitle } = this.props;

    if (!hasError) {
      return children;
    }

    if (typeof fallbackRender === 'function') {
      return fallbackRender({ error, resetErrorBoundary: this.reset });
    }

    if (fallback) {
      return fallback;
    }

    return <DefaultErrorFallback onRetry={this.reset} title={fallbackTitle} />;
  }
}

export default AppErrorBoundary;