import { MigrationTask } from '@/types';
import { readFile, getDailyNoteFilePath, fileExists } from './fileSystem';
import { extractIncompleteTasks } from './markdownParser';
import { storeGet, storeSet } from './fileSystem';
import { formatDateForFileName, parseDateFromFileName, getPreviousDay, isSameDay } from './dateUtils';

/**
 * Check if migration is needed and return incomplete tasks from previous day
 */
export async function checkMigrationNeeded(currentDate: Date): Promise<MigrationTask[]> {
  try {
    // Get last reviewed date from store
    const lastReviewedDateStr = await storeGet<string>('lastReviewedDate');

    // If never reviewed, check yesterday
    const today = new Date(currentDate);
    const yesterday = getPreviousDay(today);

    let dateToCheck: Date;

    if (!lastReviewedDateStr) {
      dateToCheck = yesterday;
    } else {
      const lastReviewedDate = parseDateFromFileName(lastReviewedDateStr);

      // If last reviewed date is today, no migration needed
      if (isSameDay(lastReviewedDate, today)) {
        return [];
      }

      // Check the day before today
      dateToCheck = yesterday;
    }

    // Get file path for the date to check
    const filePath = await getDailyNoteFilePath(dateToCheck);

    // Check if file exists
    const exists = await fileExists(filePath);
    if (!exists) {
      // No file for previous day, update last reviewed date and return empty
      await storeSet('lastReviewedDate', formatDateForFileName(today));
      return [];
    }

    // Read file content from previous day
    const result = await readFile(filePath);
    if (!result.success || !result.data) {
      return [];
    }

    // Extract incomplete tasks from previous day
    const incompleteTasks = extractIncompleteTasks(result.data, dateToCheck);

    if (incompleteTasks.length === 0) {
      // No incomplete tasks, update last reviewed date
      await storeSet('lastReviewedDate', formatDateForFileName(today));
      return [];
    }

    // Read today's file to check for already-migrated tasks
    const todayFilePath = await getDailyNoteFilePath(today);
    const todayExists = await fileExists(todayFilePath);
    let todayContent = '';

    if (todayExists) {
      const todayResult = await readFile(todayFilePath);
      if (todayResult.success && todayResult.data) {
        todayContent = todayResult.data;
      }
    }

    // Get migration history to check for already-migrated tasks
    const history = await getMigrationHistory();
    const todayDateStr = formatDateForFileName(today);
    const yesterdayDateStr = formatDateForFileName(dateToCheck);

    // Filter out tasks that have already been migrated to today
    const tasksToMigrate = incompleteTasks.filter(task => {
      // Check if task content already exists in today's note
      if (todayContent.includes(task.content)) {
        return false;
      }

      // Check if this task was previously migrated from yesterday to today
      const wasMigrated = history.some(entry =>
        entry.taskContent === task.content &&
        entry.originalDate === yesterdayDateStr &&
        entry.targetDate === todayDateStr &&
        entry.decision === 'move'
      );

      return !wasMigrated;
    });

    if (tasksToMigrate.length === 0) {
      // All tasks were already migrated, update last reviewed date
      await storeSet('lastReviewedDate', formatDateForFileName(today));
      return [];
    }

    // Convert to MigrationTask format
    const migrationTasks: MigrationTask[] = tasksToMigrate.map(task => ({
      id: task.id,
      content: task.content,
      originalDate: formatDateForFileName(dateToCheck),
      lineNumber: task.lineNumber,
      indentLevel: task.indentLevel
    }));

    return migrationTasks;
  } catch (error) {
    console.error('Error checking migration:', error);
    return [];
  }
}

/**
 * Mark migration as complete for current date
 */
export async function completeMigration(currentDate: Date): Promise<void> {
  try {
    await storeSet('lastReviewedDate', formatDateForFileName(currentDate));
  } catch (error) {
    console.error('Error completing migration:', error);
  }
}

/**
 * Get migration history
 */
export async function getMigrationHistory(): Promise<any[]> {
  try {
    const history = await storeGet<any[]>('migrationHistory') || [];
    return history;
  } catch (error) {
    console.error('Error getting migration history:', error);
    return [];
  }
}

/**
 * Add migration decision to history
 */
export async function addMigrationHistory(
  taskContent: string,
  originalDate: string,
  decision: 'move' | 'dismiss',
  targetDate?: string
): Promise<void> {
  try {
    const history = await getMigrationHistory();
    history.push({
      taskContent,
      originalDate,
      decision,
      targetDate,
      timestamp: new Date().toISOString()
    });

    await storeSet('migrationHistory', history);
  } catch (error) {
    console.error('Error adding migration history:', error);
  }
}
