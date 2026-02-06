import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, NoteColor, SortOption } from '@/types';
import { notesService } from '@/lib/notesService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotesStore {
  // State
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  filterTag: string | null;
  showArchived: boolean;
  sortBy: SortOption;
  isLoading: boolean;
  isOffline: boolean;
  pendingSyncIds: string[];
  page: number;
  hasMore: boolean;

  // Actions
  addNote: () => string;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  duplicateNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterTag: (tag: string | null) => void;
  setShowArchived: (show: boolean) => void;
  setSortBy: (sort: SortOption) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;
  setNoteColor: (id: string, color: NoteColor) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  fetchNotes: (reset?: boolean) => Promise<void>;
  fetchMoreNotes: () => Promise<void>;
  syncLocalToCloud: () => Promise<void>;
  syncPending: () => Promise<void>;
  setIsOffline: (offline: boolean) => void;
  setupSubscriptions: () => () => void;
  togglePublic: (id: string) => Promise<void>;

  // Selectors
  getActiveNote: () => Note | null;
  getFilteredNotes: () => Note[];
  getAllTags: () => string[];
}

const generateId = () => `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createEmptyNote = (): Note => ({
  id: generateId(),
  title: '',
  content: '',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPinned: false,
  isArchived: false,
  color: 'default',
});

// Helper to map Note properties to DB columns
const mapToDb = (note: Partial<Note>): any => {
  const mapped: any = {};
  if (note.title !== undefined) mapped.title = note.title;
  if (note.content !== undefined) mapped.content = note.content;
  if (note.tags !== undefined) mapped.tags = note.tags;
  if (note.isPinned !== undefined) mapped.is_pinned = note.isPinned;
  if (note.isArchived !== undefined) mapped.is_archived = note.isArchived;
  if (note.color !== undefined) mapped.color = note.color;
  if (note.public_slug !== undefined) mapped.public_slug = note.public_slug;
  if (note.is_public !== undefined) mapped.is_public = note.is_public;
  if (note.user_id !== undefined) mapped.user_id = note.user_id;
  return mapped;
};

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      activeNoteId: null,
      searchQuery: '',
      filterTag: null,
      showArchived: false,
      sortBy: 'updated',
      isLoading: false,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      pendingSyncIds: [],
      page: 1,
      hasMore: true,

      // Actions
      fetchNotes: async (reset = true) => {
        const { data: { user } = { user: null } } = await supabase.auth.getUser();
        if (!user) return;

        const { searchQuery, page } = get();
        const currentPage = reset ? 1 : page;
        set({ isLoading: true });

        try {
          const { data: notes, count } = await notesService.getNotesPaged(currentPage, 30, searchQuery);
          const formattedNotes: Note[] = notes.map((n: any) => ({
            id: n.id,
            user_id: n.user_id,
            title: n.title,
            content: n.content,
            tags: n.tags || [],
            createdAt: n.created_at,
            updatedAt: n.updated_at,
            isPinned: n.is_pinned,
            isArchived: n.is_archived,
            color: n.color as NoteColor,
            public_slug: n.public_slug,
            is_public: n.is_public,
          }));

          set((state) => ({
            notes: reset ? formattedNotes : [...state.notes, ...formattedNotes],
            isLoading: false,
            page: currentPage,
            hasMore: state.notes.length + formattedNotes.length < (count || 0),
          }));
        } catch (error) {
          console.error('Error fetching notes:', error);
          set({ isLoading: false });
        }
      },

      fetchMoreNotes: async () => {
        const { isLoading, hasMore, page } = get();
        if (isLoading || !hasMore) return;

        set({ page: page + 1 });
        await get().fetchNotes(false);
      },

      syncLocalToCloud: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { notes } = get();
        const localNotes = notes.filter(n => !n.user_id);

        for (const note of localNotes) {
          try {
            await notesService.createNote(mapToDb(note));
          } catch (error) {
            console.error('Error syncing note:', error);
          }
        }

        await get().fetchNotes();
      },

      addNote: () => {
        const newNote = createEmptyNote();
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
          pendingSyncIds: [...state.pendingSyncIds, newNote.id],
        }));

        if (!get().isOffline) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              notesService.createNote(mapToDb({
                title: '',
                content: '',
                tags: [],
                isPinned: false,
                isArchived: false,
                color: 'default'
              })).then(dbNote => {
                set(state => ({
                  notes: state.notes.map(n => n.id === newNote.id ? {
                    ...n,
                    id: dbNote.id,
                    user_id: dbNote.user_id,
                    createdAt: dbNote.created_at,
                    updatedAt: dbNote.updated_at
                  } : n),
                  activeNoteId: state.activeNoteId === newNote.id ? dbNote.id : state.activeNoteId,
                  pendingSyncIds: state.pendingSyncIds.filter(id => id !== newNote.id)
                }));
              }).catch(() => { });
            }
          });
        }

        return newNote.id;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date().toISOString() }
              : note
          ),
          pendingSyncIds: state.pendingSyncIds.includes(id) ? state.pendingSyncIds : [...state.pendingSyncIds, id],
        }));

        if (!get().isOffline) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              notesService.updateNote(id, mapToDb(updates)).then(() => {
                set(state => ({
                  pendingSyncIds: state.pendingSyncIds.filter(pid => pid !== id)
                }));
              }).catch(console.error);
            }
          });
        }
      },

      deleteNote: (id) => {
        set((state) => {
          const newNotes = state.notes.filter((note) => note.id !== id);
          const newActiveId =
            state.activeNoteId === id
              ? newNotes.length > 0
                ? newNotes[0].id
                : null
              : state.activeNoteId;
          return { notes: newNotes, activeNoteId: newActiveId };
        });

        if (!get().isOffline) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              notesService.deleteNote(id).catch(console.error);
            }
          });
        }
      },

      duplicateNote: (id) => {
        const note = get().notes.find((n) => n.id === id);
        if (note) {
          const duplicated: Note = {
            ...note,
            id: generateId(),
            title: `${note.title} (copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            notes: [duplicated, ...state.notes],
            activeNoteId: duplicated.id,
            pendingSyncIds: [...state.pendingSyncIds, duplicated.id]
          }));

          if (!get().isOffline) {
            get().syncPending();
          }
        }
      },

      setActiveNote: (id) => set({ activeNoteId: id }),
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().fetchNotes(true);
      },
      setFilterTag: (tag) => set({ filterTag: tag }),
      setShowArchived: (show) => set({ showArchived: show }),
      setSortBy: (sort) => set({ sortBy: sort }),

      setIsOffline: (offline) => {
        set({ isOffline: offline });
        if (!offline) {
          get().syncPending();
        }
      },

      syncPending: async () => {
        const { pendingSyncIds, notes, isOffline } = get();
        if (isOffline || pendingSyncIds.length === 0) return;

        for (const id of pendingSyncIds) {
          const note = notes.find(n => n.id === id);
          if (!note) continue;

          try {
            if (note.user_id) {
              await notesService.updateNote(id, mapToDb(note));
            } else {
              const dbNote = await notesService.createNote(mapToDb(note));

              set(state => ({
                notes: state.notes.map(n => n.id === id ? {
                  ...n,
                  id: dbNote.id,
                  user_id: dbNote.user_id
                } : n)
              }));
            }

            set(state => ({
              pendingSyncIds: state.pendingSyncIds.filter(pid => pid !== id)
            }));
          } catch (error) {
            console.error(`Failed to sync note ${id}:`, error);
          }
        }
      },

      togglePin: (id) => {
        const note = get().notes.find(n => n.id === id);
        if (!note) return;
        get().updateNote(id, { isPinned: !note.isPinned });
      },

      toggleArchive: (id) => {
        const note = get().notes.find(n => n.id === id);
        if (!note) return;
        get().updateNote(id, { isArchived: !note.isArchived });
      },

      setNoteColor: (id, color) => {
        get().updateNote(id, { color });
      },

      togglePublic: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('You must be signed in to share notes.');
          return;
        }

        const note = get().notes.find(n => n.id === id);
        if (!note) return;

        const is_public = !note.is_public;
        let public_slug = note.public_slug;

        if (is_public && !public_slug) {
          public_slug = Math.random().toString(36).substring(2, 10);
        }

        get().updateNote(id, { is_public, public_slug } as any);
      },

      addTag: (id, tag) => {
        const trimmedTag = tag.trim().toLowerCase();
        if (!trimmedTag) return;
        const note = get().notes.find(n => n.id === id);
        if (note && !note.tags.includes(trimmedTag)) {
          get().updateNote(id, { tags: [...note.tags, trimmedTag] });
        }
      },

      removeTag: (id, tag) => {
        const note = get().notes.find(n => n.id === id);
        if (note) {
          get().updateNote(id, { tags: note.tags.filter(t => t !== tag) });
        }
      },

      setupSubscriptions: () => {
        const channel = supabase
          .channel('notes-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notes' },
            (payload) => {
              const { eventType, new: newNote, old: oldNote } = payload;

              set((state) => {
                let updatedNotes = [...state.notes];

                if (eventType === 'INSERT') {
                  const exists = updatedNotes.some(n => n.id === newNote.id);
                  if (!exists) {
                    updatedNotes = [
                      {
                        id: newNote.id,
                        user_id: newNote.user_id,
                        title: newNote.title,
                        content: newNote.content,
                        tags: newNote.tags || [],
                        createdAt: newNote.created_at,
                        updatedAt: newNote.updated_at,
                        isPinned: newNote.is_pinned,
                        isArchived: newNote.is_archived,
                        color: newNote.color as NoteColor,
                        public_slug: newNote.public_slug,
                        is_public: newNote.is_public,
                      },
                      ...updatedNotes
                    ];
                  }
                } else if (eventType === 'UPDATE') {
                  updatedNotes = updatedNotes.map(n => n.id === newNote.id ? {
                    ...n,
                    title: newNote.title,
                    content: newNote.content,
                    tags: newNote.tags || [],
                    updatedAt: newNote.updated_at,
                    isPinned: newNote.is_pinned,
                    isArchived: newNote.is_archived,
                    color: newNote.color as NoteColor,
                    public_slug: newNote.public_slug,
                    is_public: newNote.is_public,
                  } : n);
                } else if (eventType === 'DELETE') {
                  updatedNotes = updatedNotes.filter(n => n.id !== oldNote.id);
                }

                return { notes: updatedNotes };
              });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      // Selectors
      getActiveNote: () => {
        const state = get();
        return state.notes.find((note) => note.id === state.activeNoteId) || null;
      },

      getFilteredNotes: () => {
        const state = get();
        let filtered = state.notes.filter((note) =>
          state.showArchived ? note.isArchived : !note.isArchived
        );

        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (note) =>
              note.title.toLowerCase().includes(query) ||
              note.content.toLowerCase().includes(query) ||
              note.tags.some((tag) => tag.includes(query))
          );
        }

        if (state.filterTag) {
          filtered = filtered.filter((note) => note.tags.includes(state.filterTag!));
        }

        filtered.sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }

          switch (state.sortBy) {
            case 'updated':
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            case 'created':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'title':
              return a.title.localeCompare(b.title);
            default:
              return 0;
          }
        });

        return filtered;
      },

      getAllTags: () => {
        const state = get();
        const tagSet = new Set<string>();
        state.notes.forEach((note) => {
          note.tags.forEach((tag) => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
      },
    }),
    {
      name: 'elegant-notes-storage',
      partialize: (state) => ({
        notes: state.notes,
        sortBy: state.sortBy,
        pendingSyncIds: state.pendingSyncIds,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useNotesStore.getState().setIsOffline(false));
  window.addEventListener('offline', () => useNotesStore.getState().setIsOffline(true));
}
