import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { SaveProvider } from './state/save';
import { PixelWipeProvider } from './components/PixelWipe';
import './styles/tokens.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SaveProvider>
      <PixelWipeProvider>
        <App />
      </PixelWipeProvider>
    </SaveProvider>
  </StrictMode>,
);
