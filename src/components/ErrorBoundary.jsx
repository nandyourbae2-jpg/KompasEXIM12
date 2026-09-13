import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--color-canvas)',
          borderRadius: '12px',
          border: '1px solid var(--color-hairline)',
          margin: '1rem'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--color-ink)', marginBottom: '0.5rem' }}>
            Halaman ini mengalami masalah
          </h3>
          <p style={{ color: 'var(--color-ink-muted-48)', marginBottom: '1rem', fontSize: '14px' }}>
            {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
