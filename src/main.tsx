import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';
import './index.css';

// Custom Chakra UI theme matching ADHDNotes color palette
const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true
  },
  fonts: {
    heading: `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    mono: `'JetBrains Mono', 'Fira Code', Consolas, monospace`
  },
  colors: {
    brand: {
      50: '#ECF8F6',
      100: '#DFF1EE',
      200: '#CFECE6',
      300: '#BFE6DD',
      400: '#A5DDD3',
      500: '#9AC7C1', // Calm Teal (primary)
      600: '#84B6AD',
      700: '#6EA3A0', // Muted Teal
      800: '#4F8B84',
      900: '#2F6C64'
    },
    slate: {
      50: '#F1F2F3',
      100: '#E4E7EA', // Cool Grey 1
      200: '#C8CDD1', // Cool Grey 2
      300: '#97A0A6',
      400: '#6D797E',
      500: '#3F4A4F', // Slate Ink (primary text/logo)
      600: '#30383B',
      700: '#2F3A3E' // Charcoal Soft
    },
    lavender: {
      50: '#F6F3FB',
      100: '#EEEAF8',
      200: '#E4DFF3',
      300: '#DACFF0',
      400: '#D0C6EB',
      500: '#C9C4E2',
      600: '#B7AEE0',
      700: '#9F8ECB',
      800: '#8976B1',
      900: '#6E548C'
    },
    peach: {
      50: '#FEF6F3',
      100: '#FDEDE7',
      200: '#FBE1D6',
      300: '#F8D5C6',
      400: '#F5CBB8',
      500: '#F2C7B2',
      600: '#EFB69F',
      700: '#E6A07F',
      800: '#DE8865',
      900: '#C86847'
    }
  },
  styles: {
    global: {
      body: {
        bg: '#F7F3EF', // Mist White
        color: 'slate.500'
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
