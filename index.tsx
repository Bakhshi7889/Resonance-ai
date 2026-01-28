import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
    // Fix: Explicitly cast 'this' to any to handle potential TS issue with React.Component inheritance where props is missing
    return (this as any).props.children;
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

// SERVICE WORKER CLEANUP
// Aggressively remove any old service workers to prevent cache poisoning or 404s
if ('serviceWorker' in navigator) {
  const killSW = () => {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister().catch(e => console.warn('SW Unregister Warning:', e));
      }
    }).catch(e => console.warn('SW Access Warning:', e));
  };

  // Run cleanup if document is ready, otherwise wait for load
  if (document.readyState === 'complete') {
    killSW();
  } else {
    window.addEventListener('load', killSW);
  }
}