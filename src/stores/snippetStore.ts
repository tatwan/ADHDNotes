import { create } from 'zustand';
import type { Snippet } from '../types';

interface SnippetStore {
    snippets: Snippet[];
    selectedSnippetId: number | null;
    viewMode: 'notes' | 'bookmarks' | 'snippets';

    // Actions
    loadSnippets: () => Promise<void>;
    getSelectedSnippet: () => Snippet | undefined;
    setSelectedSnippet: (id: number | null) => void;
    updateSnippetContent: (id: number, content: string) => Promise<void>;
    deleteSnippet: (id: number) => Promise<void>;
    deleteAllSnippets: () => Promise<void>;
    setViewMode: (mode: 'notes' | 'bookmarks' | 'snippets') => void;
}

export const useSnippetStore = create<SnippetStore>((set, get) => ({
    snippets: [],
    selectedSnippetId: null,
    viewMode: 'notes',

    loadSnippets: async () => {
        try {
            const result = await window.electronAPI.getSnippets();
            if (result.success && result.snippets) {
                set({ snippets: result.snippets });
            }
        } catch (error) {
            console.error('Failed to load snippets:', error);
        }
    },

    getSelectedSnippet: () => {
        const { snippets, selectedSnippetId } = get();
        return snippets.find(s => s.id === selectedSnippetId);
    },

    setSelectedSnippet: (id: number | null) => {
        set({ selectedSnippetId: id });
    },

    updateSnippetContent: async (id: number, content: string) => {
        try {
            const result = await window.electronAPI.updateSnippet(id, content);
            if (result.success) {
                // Reload snippets to get updated data
                await get().loadSnippets();
            }
        } catch (error) {
            console.error('Failed to update snippet:', error);
        }
    },

    deleteSnippet: async (id: number) => {
        try {
            const result = await window.electronAPI.deleteSnippet(id);
            if (result.success) {
                // Remove from local state
                set(state => ({
                    snippets: state.snippets.filter(s => s.id !== id),
                    selectedSnippetId: state.selectedSnippetId === id ? null : state.selectedSnippetId
                }));
            }
        } catch (error) {
            console.error('Failed to delete snippet:', error);
        }
    },

    deleteAllSnippets: async () => {
        try {
            const result = await window.electronAPI.deleteAllSnippets();
            if (result.success) {
                set({ snippets: [], selectedSnippetId: null });
            }
        } catch (error) {
            console.error('Failed to delete all snippets:', error);
        }
    },

    setViewMode: (mode: 'notes' | 'bookmarks' | 'snippets') => {
        set({ viewMode: mode });
    },
}));
