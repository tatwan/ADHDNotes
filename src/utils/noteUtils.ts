import { fileExists, getDailyNoteFilePath, readFile } from './fileSystem';
import { formatDateForFileName } from './dateUtils';
import { parseMarkdownContent } from './markdownParser';

export interface DateContentIndicators {
  hasTasks: boolean;
  hasTimeBlocks: boolean;
}

/**
 * Check if a note exists for a given date
 */
export async function hasNoteForDate(date: Date): Promise<boolean> {
  try {
    const filePath = await getDailyNoteFilePath(date);
    return await fileExists(filePath);
  } catch (error) {
    console.error('Error checking note for date:', error);
    return false;
  }
}

/**
 * Get content indicators for dates in a month that have notes with tasks or time blocks
 */
export async function getDatesWithContentIndicators(year: number, month: number): Promise<Map<string, DateContentIndicators>> {
  const datesWithContent = new Map<string, DateContentIndicators>();

  // Check each day in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const checks = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    checks.push(
      checkDateContentIndicators(date).then(indicators => {
        if (indicators.hasTasks || indicators.hasTimeBlocks) {
          datesWithContent.set(formatDateForFileName(date), indicators);
        }
      })
    );
  }

  await Promise.all(checks);

  return datesWithContent;
}

/**
 * Get all dates in a month that have notes with actual tasks (legacy function for backward compatibility)
 */
export async function getDatesWithNotesInMonth(year: number, month: number): Promise<Set<string>> {
  const contentIndicators = await getDatesWithContentIndicators(year, month);
  return new Set(contentIndicators.keys());
}

/**
 * Check what types of content a date has (tasks and/or time blocks)
 */
async function checkDateContentIndicators(date: Date): Promise<DateContentIndicators> {
  try {
    const filePath = await getDailyNoteFilePath(date);
    const exists = await fileExists(filePath);

    if (!exists) {
      return { hasTasks: false, hasTimeBlocks: false };
    }

    // Read the file content
    const result = await readFile(filePath);
    if (!result.success || !result.data) {
      return { hasTasks: false, hasTimeBlocks: false };
    }

    // Parse the content to extract tasks and time blocks
    const { tasks, timeBlocks } = parseMarkdownContent(result.data, date);

    // Check if there are any tasks/time blocks with actual content (not empty)
    const hasTasks = tasks.some(task => task.content.trim().length > 0);
    const hasTimeBlocks = timeBlocks.some(block => block.content.trim().length > 0);

    return { hasTasks, hasTimeBlocks };
  } catch (error) {
    console.error('Error checking content indicators for date:', error);
    return { hasTasks: false, hasTimeBlocks: false };
  }
}
