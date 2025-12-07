import './polyfills';
// Use dynamic import to ensure polyfills are applied BEFORE main's imports are evaluated
import('./main').catch(err => console.error('Failed to load main process:', err));
