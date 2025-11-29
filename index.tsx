import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(<App />);
  } catch (error) {
    console.error("Critical Render Error:", error);
    container.innerHTML = `<div style="color:red; padding:20px;">Failed to initialize app. Check console for details.</div>`;
  }
} else {
  console.error("Root element not found");
}