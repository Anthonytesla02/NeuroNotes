import { Note } from '../types';

const STORAGE_KEY = 'neuronotes_data';

export const getNotes = (): Note[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load notes", e);
    return [];
  }
};

export const saveNote = (note: Note): void => {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === note.id);
  if (index >= 0) {
    notes[index] = note;
  } else {
    notes.unshift(note);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const deleteNote = (id: string): void => {
  const notes = getNotes().filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const getNote = (id: string): Note | undefined => {
  return getNotes().find(n => n.id === id);
};
