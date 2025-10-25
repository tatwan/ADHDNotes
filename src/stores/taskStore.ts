import { create } from 'zustand';
import { Task } from '@/types';
import { useNoteStore } from './noteStore';
import {
  toggleTaskInMarkdown,
  toggleTimeBlockInMarkdown,
  addScheduledTimeToTask,
  removeScheduledTimeFromTask
} from '@utils/markdownParser';

interface TaskStoreState {
  selectedTaskId: string | null;
  scheduledTasks: Map<string, Task[]>;

  // Actions
  toggleTaskCompletion: (taskId: string, lineNumber: number) => void;
  toggleTimeBlockCompletion: (blockId: string, lineNumber: number) => void;
  scheduleTask: (taskId: string, time: string) => void;
  unscheduleTask: (taskId: string) => void;
  getTasksForTime: (time: string) => Task[];
  getScheduledTasks: () => Map<string, Task[]>;
  setSelectedTask: (taskId: string | null) => void;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  selectedTaskId: null,
  scheduledTasks: new Map(),

  setSelectedTask: (taskId: string | null) => {
    set({ selectedTaskId: taskId });
  },

  toggleTaskCompletion: (_taskId: string, lineNumber: number) => {
    const noteStore = useNoteStore.getState();
    const currentNote = noteStore.currentNote;

    if (!currentNote) return;

    // Toggle in markdown
    const updatedContent = toggleTaskInMarkdown(currentNote.content, lineNumber);

    // Update note store
    noteStore.updateNoteContent(updatedContent);
  },

  toggleTimeBlockCompletion: (_blockId: string, lineNumber: number) => {
    const noteStore = useNoteStore.getState();
    const currentNote = noteStore.currentNote;

    if (!currentNote) return;

    // Toggle in markdown
    const updatedContent = toggleTimeBlockInMarkdown(currentNote.content, lineNumber);

    // Update note store
    noteStore.updateNoteContent(updatedContent);
  },

  scheduleTask: (taskId: string, time: string) => {
    const noteStore = useNoteStore.getState();
    const currentNote = noteStore.currentNote;

    if (!currentNote) return;

    // Find task
    const task = currentNote.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Add time to markdown
    const updatedContent = addScheduledTimeToTask(currentNote.content, task.lineNumber, time);

    // Update note store
    noteStore.updateNoteContent(updatedContent);

    // Update scheduled tasks map
    const scheduledTasks = new Map(get().scheduledTasks);
    const tasksAtTime = scheduledTasks.get(time) || [];
    tasksAtTime.push({ ...task, scheduledTime: time });
    scheduledTasks.set(time, tasksAtTime);

    set({ scheduledTasks });
  },

  unscheduleTask: (taskId: string) => {
    const noteStore = useNoteStore.getState();
    const currentNote = noteStore.currentNote;

    if (!currentNote) return;

    // Find task
    const task = currentNote.tasks.find(t => t.id === taskId);
    if (!task || !task.scheduledTime) return;

    // Remove time from markdown
    const updatedContent = removeScheduledTimeFromTask(currentNote.content, task.lineNumber);

    // Update note store
    noteStore.updateNoteContent(updatedContent);

    // Update scheduled tasks map
    const scheduledTasks = new Map(get().scheduledTasks);
    const time = task.scheduledTime;
    const tasksAtTime = scheduledTasks.get(time) || [];
    const filteredTasks = tasksAtTime.filter(t => t.id !== taskId);

    if (filteredTasks.length === 0) {
      scheduledTasks.delete(time);
    } else {
      scheduledTasks.set(time, filteredTasks);
    }

    set({ scheduledTasks });
  },

  getTasksForTime: (time: string): Task[] => {
    const noteStore = useNoteStore.getState();
    const currentNote = noteStore.currentNote;

    if (!currentNote) return [];

    // Get tasks with scheduled time matching the requested time
    return currentNote.tasks.filter(task => task.scheduledTime === time);
  },

  getScheduledTasks: (): Map<string, Task[]> => {
    const noteStore = useNoteStore.getState();
    const currentNote = noteStore.currentNote;

    if (!currentNote) return new Map();

    // Build map of time -> tasks
    const scheduledTasks = new Map<string, Task[]>();

    currentNote.tasks.forEach(task => {
      if (task.scheduledTime) {
        const tasksAtTime = scheduledTasks.get(task.scheduledTime) || [];
        tasksAtTime.push(task);
        scheduledTasks.set(task.scheduledTime, tasksAtTime);
      }
    });

    return scheduledTasks;
  }
}));
