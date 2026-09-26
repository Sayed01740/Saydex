import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { WalletProvider } from './context/WalletContext';
import { ProtocolProvider } from './context/ProtocolContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <WalletProvider>
          <ProtocolProvider>
            <App />
          </ProtocolProvider>
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

