import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Critical Application Error:", error);
    container.innerHTML = `
      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        height: 100vh; 
        background-color: #0b0e11; 
        color: #ef5350; 
        font-family: sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <h1 style="font-size: 24px; margin-bottom: 10px;">Application Failed to Load</h1>
        <p style="color: #848e9c; margin-bottom: 20px;">Please check the console for detailed error logs.</p>
        <button onclick="window.location.reload()" style="
          padding: 10px 20px; 
          background-color: #2962FF; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer;
        ">Reload Page</button>
      </div>
    `;
  }
} else {
  console.error("Root element not found. Ensure your index.html has a <div id='root'></div>.");
}