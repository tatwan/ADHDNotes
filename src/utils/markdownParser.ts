import { Task, TimeBlock, TASK_REGEX, TIME_BLOCK_REGEX } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { formatDateForFileName } from './dateUtils';

/**
 * Parse markdown content to extract tasks and time blocks
 */
export function parseMarkdownContent(content: string, noteDate: Date): { tasks: Task[]; timeBlocks: TimeBlock[] } {
  const lines = content.split('\n');
  const tasks: Task[] = [];
  const timeBlocks: TimeBlock[] = [];
  const taskStack: Array<{ task: Task; indentLevel: number }> = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for time block first (+ [ ] or + [x])
    const timeBlockMatch = line.match(TIME_BLOCK_REGEX);
    if (timeBlockMatch) {
      const [, completed, time, content] = timeBlockMatch;

      timeBlocks.push({
        id: uuidv4(),
        content: content.trim(),
        completed: completed === 'x',
        startTime: time || undefined,
        duration: 60, // default 1 hour
        lineNumber
      });
      return;
    }

    // Check for task (* [ ] or * [x] or - [ ] or - [x])
    const taskMatch = line.match(TASK_REGEX);
    if (taskMatch) {
      const [, , completed, content] = taskMatch;

      // Calculate indent level (spaces or tabs before the task marker)
      const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
      const indentLevel = Math.floor(leadingWhitespace.length / 2); // 2 spaces = 1 indent level

      // Extract scheduled time if present in content (e.g., "10:00 AM Task content")
      let taskContent = content.trim();
      let scheduledTime: string | undefined;

      const timeMatch = taskContent.match(/^(\d{1,2}:\d{2})\s+(.+)$/);
      if (timeMatch) {
        scheduledTime = timeMatch[1];
        taskContent = timeMatch[2];
      }

      const task: Task = {
        id: uuidv4(),
        content: taskContent,
        completed: completed === 'x',
        lineNumber,
        createdDate: formatDateForFileName(noteDate),
        scheduledTime,
        indentLevel
      };

      // Handle parent-child relationships
      if (indentLevel > 0) {
        // Find parent task
        for (let i = taskStack.length - 1; i >= 0; i--) {
          if (taskStack[i].indentLevel < indentLevel) {
            task.parentId = taskStack[i].task.id;
            break;
          }
        }
      }

      // Update task stack
      taskStack.push({ task, indentLevel });
      // Remove tasks from stack that are at same or higher indent level
      while (taskStack.length > 1 && taskStack[taskStack.length - 2].indentLevel >= indentLevel) {
        taskStack.splice(taskStack.length - 2, 1);
      }

      tasks.push(task);
    }
  });

  return { tasks, timeBlocks };
}

/**
 * Extract incomplete tasks from markdown content
 */
export function extractIncompleteTasks(content: string, noteDate: Date): Task[] {
  const { tasks } = parseMarkdownContent(content, noteDate);
  return tasks.filter(task => !task.completed && task.content.trim() !== '');
}

/**
 * Update task completion in markdown content
 */
export function toggleTaskInMarkdown(content: string, lineNumber: number): string {
  const lines = content.split('\n');

  if (lineNumber <= 0 || lineNumber > lines.length) {
    return content;
  }

  const line = lines[lineNumber - 1];

  // Toggle task checkbox
  if (line.match(/\*\s+\[\s\]/)) {
    lines[lineNumber - 1] = line.replace(/\*\s+\[\s\]/, '* [x]');
  } else if (line.match(/\*\s+\[x\]/i)) {
    lines[lineNumber - 1] = line.replace(/\*\s+\[x\]/i, '* [ ]');
  } else if (line.match(/\-\s+\[\s\]/)) {
    lines[lineNumber - 1] = line.replace(/\-\s+\[\s\]/, '- [x]');
  } else if (line.match(/\-\s+\[x\]/i)) {
    lines[lineNumber - 1] = line.replace(/\-\s+\[x\]/i, '- [ ]');
  }

  return lines.join('\n');
}

/**
 * Toggle time block completion in markdown content
 */
export function toggleTimeBlockInMarkdown(content: string, lineNumber: number): string {
  const lines = content.split('\n');

  if (lineNumber <= 0 || lineNumber > lines.length) {
    return content;
  }

  const line = lines[lineNumber - 1];

  // Toggle time block checkbox
  if (line.match(/\+\s+\[\s\]/)) {
    lines[lineNumber - 1] = line.replace(/\+\s+\[\s\]/, '+ [x]');
  } else if (line.match(/\+\s+\[x\]/i)) {
    lines[lineNumber - 1] = line.replace(/\+\s+\[x\]/i, '+ [ ]');
  }

  return lines.join('\n');
}

/**
 * Add scheduled time to task in markdown content
 */
export function addScheduledTimeToTask(content: string, lineNumber: number, time: string): string {
  const lines = content.split('\n');

  if (lineNumber <= 0 || lineNumber > lines.length) {
    return content;
  }

  const line = lines[lineNumber - 1];
  const taskMatch = line.match(/^(\s*[\*\-]\s+\[\s\])\s+(?:\d{1,2}:\d{2}\s+)?(.+)$/);

  if (taskMatch) {
    const [, prefix, content] = taskMatch;
    lines[lineNumber - 1] = `${prefix} ${time} ${content}`;
  }

  return lines.join('\n');
}

/**
 * Remove scheduled time from task in markdown content
 */
export function removeScheduledTimeFromTask(content: string, lineNumber: number): string {
  const lines = content.split('\n');

  if (lineNumber <= 0 || lineNumber > lines.length) {
    return content;
  }

  const line = lines[lineNumber - 1];
  const taskMatch = line.match(/^(\s*[\*\-]\s+\[[x\s]\])\s+\d{1,2}:\d{2}\s+(.+)$/);

  if (taskMatch) {
    const [, prefix, content] = taskMatch;
    lines[lineNumber - 1] = `${prefix} ${content}`;
  }

  return lines.join('\n');
}

/**
 * Insert new task at end of content
 */
export function insertTask(content: string, taskContent: string): string {
  const newTask = `* [ ] ${taskContent}`;
  return content.trim() ? `${content}\n${newTask}` : newTask;
}

/**
 * Insert migrated task under the Tasks section
 */
export function insertMigratedTask(content: string, taskContent: string): string {
  const lines = content.split('\n');
  const newTask = `* [ ] ${taskContent}`;

  // Find the Tasks section
  let tasksSectionIndex = -1;
  let timeBlocksSectionIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '## Tasks') {
      tasksSectionIndex = i;
    } else if (line === '## Time Blocks') {
      timeBlocksSectionIndex = i;
      break;
    }
  }

  if (tasksSectionIndex !== -1) {
    // Find where to insert the task (after the Tasks header, before Time Blocks or end)
    let insertIndex = tasksSectionIndex + 1;

    // Skip empty lines after the header
    while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      insertIndex++;
    }

    // If we found Time Blocks section, insert before it
    if (timeBlocksSectionIndex !== -1) {
      insertIndex = Math.min(insertIndex, timeBlocksSectionIndex);
    }

    // Insert the task
    lines.splice(insertIndex, 0, newTask);
    return lines.join('\n');
  }

  // Fallback: if no Tasks section found, add to end
  return insertTask(content, taskContent);
}

/**
 * Insert new time block at end of content
 */
export function insertTimeBlock(content: string, blockContent: string, time?: string): string {
  const timePrefix = time ? `${time} ` : '';
  const newBlock = `+ [ ] ${timePrefix}${blockContent}`;
  return content.trim() ? `${content}\n${newBlock}` : newBlock;
}

/**
 * Generate daily note template
 */
export function generateDailyNoteTemplate(date: Date): string {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `# ${dayName}, ${dateStr}

## Today's Focus


## Tasks

* [ ]


## Time Blocks


## Notes

`;
}
