import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for ULTRA INSTALL MODE
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.debug('ServiceWorker registration failed: ', err);
    });
  });
}

// Handle PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // For premium feel, we let the browser handle the default prompt when appropriate
  console.debug('Application is installable.');
});

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