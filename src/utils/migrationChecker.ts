import { MigrationTask } from '@/types';
import { readFile, getDailyNoteFilePath, fileExists } from './fileSystem';
import { extractIncompleteTasks } from './markdownParser';
import { storeGet, storeSet, storeDelete } from './fileSystem';
import { formatDateForFileName, parseDateFromFileName, getPreviousDay, isSameDay } from './dateUtils';

/**
 * Find the most recent date with incomplete tasks, searching backwards from startDate
 * @param startDate - Date to start searching from (going backwards)
 * @param maxDaysBack - Maximum number of days to search back (default 30)
 * @returns The most recent date with incomplete tasks, or null if none found
 */
async function findMostRecentDateWithIncompleteTasks(startDate: Date, maxDaysBack: number = 30): Promise<Date | null> {
  let currentDate = new Date(startDate);
  let daysChecked = 0;

  while (daysChecked < maxDaysBack) {
    const filePath = await getDailyNoteFilePath(currentDate);
    const exists = await fileExists(filePath);

    if (exists) {
      const result = await readFile(filePath);
      if (result.success && result.data) {
        const incompleteTasks = extractIncompleteTasks(result.data, currentDate);
        if (incompleteTasks.length > 0) {
          return currentDate;
        }
      }
    }

    // Move to previous day
    currentDate = getPreviousDay(currentDate);
    daysChecked++;
  }

  return null;
}

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

    let dateToCheck: Date | null = null;

    if (!lastReviewedDateStr) {
      // First time - search backwards from yesterday to find incomplete tasks
      dateToCheck = await findMostRecentDateWithIncompleteTasks(yesterday, 30);
    } else {
      const lastReviewedDate = parseDateFromFileName(lastReviewedDateStr);

      // If last reviewed date is today, no migration needed
      if (isSameDay(lastReviewedDate, today)) {
        return [];
      }

      // Search backwards from yesterday to find the most recent date with incomplete tasks
      dateToCheck = await findMostRecentDateWithIncompleteTasks(yesterday, 30);
    }

    if (!dateToCheck) {
      // No date with incomplete tasks found in the past 30 days
      await storeSet('lastReviewedDate', formatDateForFileName(today));
      return [];
    }

    // Get file path for the date to check
    const filePath = await getDailyNoteFilePath(dateToCheck);

    // Read file content from the date to check
    const result = await readFile(filePath);
    if (!result.success || !result.data) {
      return [];
    }

    // Extract incomplete tasks from that date
    const incompleteTasks = extractIncompleteTasks(result.data, dateToCheck);

    if (incompleteTasks.length === 0) {
      // No incomplete tasks (shouldn't happen since findMostRecentDateWithIncompleteTasks found them)
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
    const dateToCheckStr = formatDateForFileName(dateToCheck);

    // Filter out tasks that have already been migrated to today
    const tasksToMigrate = incompleteTasks.filter(task => {
      // Check if task content already exists in today's note
      if (todayContent.includes(task.content)) {
        return false;
      }

      // Check if this task was previously migrated from the source date to today
      const wasMigrated = history.some(entry =>
        entry.taskContent === task.content &&
        entry.originalDate === dateToCheckStr &&
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

/**
 * Reset migration state - useful for testing
 * This clears the last reviewed date and migration history
 */
export async function resetMigrationState(): Promise<void> {
  try {
    await storeDelete('lastReviewedDate');
    await storeDelete('migrationHistory');
    console.log('✅ Migration state reset');
  } catch (error) {
    console.error('Error resetting migration state:', error);
  }
}
