import { create } from 'zustand';

export interface Tag {
    id: number;
    name: string;
}

export interface Bookmark {
    id: number;
    url: string;
    title: string | null;
    description: string | null;
    content: string | null;
    faviconUrl: string | null;
    isProcessed: boolean;
    createdAt: string; // serialized date from JSON
    updatedAt: string; // serialized date from JSON
    tags?: Tag[];
}

interface BookmarkState {
    bookmarks: Bookmark[];
    tags: Tag[];
    selectedBookmarkId: number | null;
    viewMode: 'notes' | 'bookmarks';
    isLoading: boolean;

    // Actions
    setViewMode: (mode: 'notes' | 'bookmarks') => void;
    selectBookmark: (id: number | null) => void;
    fetchBookmarks: () => Promise<void>;
    fetchTags: () => Promise<void>;
    deleteBookmark: (id: number) => Promise<void>;

    // Getters
    getSelectedBookmark: () => Bookmark | undefined;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
    bookmarks: [],
    tags: [],
    selectedBookmarkId: null,
    viewMode: 'notes',
    isLoading: false,

    setViewMode: (mode) => set({ viewMode: mode }),

    selectBookmark: (id) => set({ selectedBookmarkId: id }),

    fetchBookmarks: async () => {
        set({ isLoading: true });
        try {
            // @ts-ignore
            const result = await window.electronAPI.getBookmarks();
            if (result.success) {
                set({ bookmarks: result.bookmarks });
            } else {
                console.error("Failed to fetch bookmarks:", result.error);
            }
        } catch (error) {
            console.error("Error fetching bookmarks:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchTags: async () => {
        try {
            // @ts-ignore
            const result = await window.electronAPI.getTags();
            if (result.success) {
                set({ tags: result.tags });
            }
        } catch (error) {
            console.error("Error fetching tags:", error);
        }
    },

    deleteBookmark: async (id) => {
        try {
            // @ts-ignore
            const result = await window.electronAPI.deleteBookmark(id);
            if (result.success) {
                set(state => ({
                    bookmarks: state.bookmarks.filter(b => b.id !== id),
                    selectedBookmarkId: state.selectedBookmarkId === id ? null : state.selectedBookmarkId
                }));
            }
        } catch (error) {
            console.error("Error deleting bookmark:", error);
        }
    },

    getSelectedBookmark: () => {
        const { bookmarks, selectedBookmarkId } = get();
        return bookmarks.find(b => b.id === selectedBookmarkId);
    }
}));
