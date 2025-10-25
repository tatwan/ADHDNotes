import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';
import './index.css';

// Custom Chakra UI theme
const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true
  },
  fonts: {
    heading: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    mono: `'Fira Code', 'JetBrains Mono', 'Consolas', monospace`
  },
  colors: {
    brand: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1'
    }
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900'
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
