import { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useAppStore } from '@stores/appStore';
import { useNoteStore } from '@stores/noteStore';
import { useTaskStore } from '@stores/taskStore';
import AppLayout from '@components/layout/AppLayout';
import MigrationModal from '@components/modals/MigrationModal';
import { createTimeString } from '@utils/dateUtils';
import { useFileWatcher } from '@hooks/useFileWatcher';
import { ThemeProvider } from '@contexts/ThemeContext';
import { resetMigrationState } from '@utils/migrationChecker';

// Expose debug helpers in development
if (process.env.NODE_ENV === 'development') {
  (window as any).debugResetMigration = resetMigrationState;
}

function App() {
  const { initialize, isInitialized, showMigrationModal, checkForMigration } = useAppStore();
  const { loadDailyNote } = useNoteStore();
  const { scheduleTask } = useTaskStore();

  // Setup file watcher
  useFileWatcher();

  useEffect(() => {
    // Initialize app on mount
    const initApp = async () => {
      await initialize();

      // Load today's daily note
      await loadDailyNote(new Date());

      // Check for migration after note is loaded
      await checkForMigration();
    };

    initApp();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Get task ID from dragged item
    const taskId = active.id as string;

    // Get time slot from drop target
    const dropData = over.data.current as { hour: number; minute: number };

    if (dropData) {
      const timeString = createTimeString(dropData.hour, dropData.minute);
      scheduleTask(taskId, timeString);
    }
  };

  if (!isInitialized) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        width="100vw"
        bg="gray.50"
      >
        Loading...
      </Box>
    );
  }

  return (
    <ThemeProvider>
      <DndContext onDragEnd={handleDragEnd}>
        <AppLayout />
        {showMigrationModal && <MigrationModal />}
      </DndContext>
    </ThemeProvider>
  );
}

export default App;
