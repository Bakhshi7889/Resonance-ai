import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { storage } from './services/storage';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Simple Error Boundary to catch render crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  
  public state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Resonance Critical Error:", error, errorInfo);
    // Explicitly cast this to any to avoid TS error: Property 'setState' does not exist on type 'ErrorBoundary'
    (this as any).setState({ errorInfo });
  }

  handleCopyLogs = () => {
    const { error, errorInfo } = this.state;
    const logContent = `CRITICAL ERROR REPORT\n---------------------\nMessage: ${error?.message}\n\nStack:\n${error?.stack}\n\nComponent Stack:\n${errorInfo?.componentStack}`;
    navigator.clipboard.writeText(logContent).then(() => {
        alert("Crash logs copied to clipboard.");
    });
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
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Malfunction</h2>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.8rem' }}>Resonance Neural Core has encountered a critical failure.</p>
          
          <div style={{ 
            background: '#111', 
            padding: '1.5rem', 
            borderRadius: '1rem', 
            maxWidth: '90%',
            width: '600px', 
            overflow: 'auto', 
            border: '1px solid #333', 
            color: '#f87171',
            textAlign: 'left',
            maxHeight: '40vh',
            marginBottom: '2rem',
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap'
          }}>
            <strong>{this.state.error?.toString()}</strong>
            <br/><br/>
            <span style={{color: '#444'}}>{this.state.errorInfo?.componentStack}</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={this.handleCopyLogs}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: '#222', 
                color: 'white', 
                border: '1px solid #444', 
                borderRadius: '0.5rem', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem'
              }}
            >
              Copy Logs
            </button>
            <button 
              onClick={async () => {
                  try {
                    await storage.clear();
                  } catch (e) {}
                  localStorage.clear();
                  window.location.reload();
              }} 
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0.5rem', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
              }}
            >
              Hard Reset & Reload
            </button>
          </div>
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

// SERVICE WORKER REGISTRATION
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('SW registration failed:', error);
    });
  });
}