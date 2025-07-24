import App from './App';
import throwExpression from './common/throwExpression';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from './contexts/ConfigContext';
import { StrictMode } from 'react';
import { ThemeProvider } from '@emotion/react';
import { createRoot } from 'react-dom/client';
import { createTheme } from '@mui/material/styles';

document.addEventListener('contextmenu', e => e.preventDefault());

createRoot(document.querySelector('#root') ?? throwExpression('root element not resolved')).render(
  <StrictMode>
    <ConfigProvider>
      <BrowserRouter>
        <ThemeProvider theme={createTheme({})}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>
);
