import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA functionality with origin and sandbox protection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Standard relative path to avoid URL construction errors in complex sandboxed environments
    const swPath = './service-worker.js';
    
    // Check if we're in a standard secure environment or localhost
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:';
    
    // Detect common sandboxed environments that might block service workers or cause origin errors
    // This handles the user's reported 'usercontent.goog' origin mismatch error.
    const isSandboxed = window.location.origin.includes('usercontent.goog') || 
                       window.location.origin.includes('ai.studio');

    if ((isSecure || isLocal) && !isSandboxed) {
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('Resonance: ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((err) => {
          // Gracefully handle origin mismatches or security blocks common in nested environments
          if (err.message && (err.message.includes('origin') || err.name === 'SecurityError')) {
            console.warn('Resonance: ServiceWorker skipped due to environment restrictions (Origin/Sandbox).');
          } else {
            console.error('Resonance: ServiceWorker registration failed: ', err);
          }
        });
    } else if (isSandboxed) {
      // Log for debugging but do not error out
      console.log('Resonance: ServiceWorker disabled for sandbox compatibility.');
    }
  });
}