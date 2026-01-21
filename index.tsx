import React, { Component, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// HTTPS Guard REMOVED to prevent "refused to connect" errors in AI Studio/Preview environments.
// The hosting provider (Netlify/Vercel) will handle HTTPS redirection automatically in production.

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary to catch render crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Resonance Critical Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          background: '#000', 
          color: '#fff', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>System Malfunction</h2>
          <p style={{ color: '#888', marginBottom: '2rem' }}>Resonance encountered a critical error.</p>
          <pre style={{ background: '#111', padding: '1rem', borderRadius: '0.5rem', maxWidth: '80%', overflow: 'auto', border: '1px solid #333', color: '#f87171' }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button 
            onClick={() => {
                localStorage.clear();
                window.location.reload();
            }} 
            style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Hard Reset & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Critical: Root element not found.</div>';
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Robust Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Resonance: SW registered: ', registration.scope);
      })
      .catch((err) => {
        console.log('Resonance: SW registration failed: ', err);
      });
  });
}