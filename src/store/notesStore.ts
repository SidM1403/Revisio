import { create } from 'zustand';

interface NotesState {
  rawText: string | null;
  summary: string | null;
  fileName: string | null;
  setNotes: (text: string, name: string) => void;
  setSummary: (summary: string | ((prev: string | null) => string)) => void;
  clearNotes: () => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  rawText: null,
  summary: null,
  fileName: null,
  setNotes: (text, name) => set({ rawText: text, fileName: name, summary: null }),
  setSummary: (summary) => set((state) => ({ 
    summary: typeof summary === 'function' ? summary(state.summary || '') : summary 
  })),
  clearNotes: () => set({ rawText: null, fileName: null, summary: null }),
}));
