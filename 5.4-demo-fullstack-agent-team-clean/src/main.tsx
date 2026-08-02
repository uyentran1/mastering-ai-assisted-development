/**
 * Browser entry point.
 *
 * The teammates' components are all prop-driven and testable in isolation;
 * this is the only file that touches the DOM directly. `fetchOnMount` is on
 * so the running app talks to the real Express API rather than MOCK_* data.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './frontend/App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to mount: no #root element in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App fetchOnMount />
  </StrictMode>,
);
