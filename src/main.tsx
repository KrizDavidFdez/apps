import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global safe JSON stringify protection against circular references (e.g. HTMLAudioElement -> FiberNode)
const originalStringify = JSON.stringify;
JSON.stringify = function (value: any, replacer?: any, space?: any) {
  const seen = new WeakSet();
  const safeReplacer = (key: string, val: any) => {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);
    }
    if (typeof replacer === 'function') {
      return replacer(key, val);
    }
    return val;
  };
  return originalStringify(value, safeReplacer, space);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

