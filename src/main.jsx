// Polyfill for Node.js crypto in browser (required by some dependencies)
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.getRandomValues === 'undefined') {
  globalThis.crypto.getRandomValues = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };
}
// Polyfill for Node.js crypto.randomBytes
if (typeof globalThis.crypto.randomBytes === 'undefined') {
  globalThis.crypto.randomBytes = (size) => {
    const arr = new Uint8Array(size);
    globalThis.crypto.getRandomValues(arr);
    return arr;
  };
}
// Also make it available on window for Node-style access
if (typeof window !== 'undefined') {
  if (!window.crypto) window.crypto = globalThis.crypto;
  if (!window.crypto.randomBytes) window.crypto.randomBytes = globalThis.crypto.randomBytes;
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
