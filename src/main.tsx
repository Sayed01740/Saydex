import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { WalletProvider } from './context/WalletContext';
import { ProtocolProvider } from './context/ProtocolContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WalletProvider>
        <ProtocolProvider>
          <App />
        </ProtocolProvider>
      </WalletProvider>
    </ThemeProvider>
  </StrictMode>,
);

