import { useEffect } from 'react';
import { useAppStore } from '@stores/appStore';

/**
 * Hook to listen for file system changes and update the app accordingly
 */
export const useFileWatcher = () => {
  const { loadFileTree } = useAppStore();

  useEffect(() => {
    // Setup file watcher listeners
    const handleFileAdded = (filePath: string) => {
      console.log('File added:', filePath);
      loadFileTree();
    };

    const handleFileChanged = (filePath: string) => {
      console.log('File changed:', filePath);
      // Could implement reload logic here if needed
    };

    const handleFileDeleted = (filePath: string) => {
      console.log('File deleted:', filePath);
      loadFileTree();
    };

    // Register listeners
    if (window.electronAPI) {
      window.electronAPI.onFileAdded(handleFileAdded);
      window.electronAPI.onFileChanged(handleFileChanged);
      window.electronAPI.onFileDeleted(handleFileDeleted);
    }

    // Cleanup
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeFileListeners();
      }
    };
  }, [loadFileTree]);
};
