import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number;
  repetition: number;
  easeFactor: number;
  dueDate: number;
}

interface FlashcardDB extends DBSchema {
  cards: {
    key: string;
    value: Flashcard;
    indexes: { 'by-due': number };
  };
}

let dbPromise: Promise<IDBPDatabase<FlashcardDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<FlashcardDB>('StudyAI-Flashcards', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('cards')) {
        const store = db.createObjectStore('cards', { keyPath: 'id' });
        store.createIndex('by-due', 'dueDate');
      }
    },
  });
}

// SuperMemo-2 Algorithm
export function calculateSM2(quality: number, card: Flashcard): Flashcard {
  let { repetition, interval, easeFactor } = card;

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition++;
  } else {
    repetition = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const now = new Date();
  const nextDueDate = now.getTime() + interval * 24 * 60 * 60 * 1000;

  return {
    ...card,
    repetition,
    interval,
    easeFactor,
    dueDate: nextDueDate,
  };
}

export async function addCards(cards: Pick<Flashcard, 'front' | 'back'>[]) {
  if (!dbPromise) return;
  const db = await dbPromise;
  const tx = db.transaction('cards', 'readwrite');
  
  for (const c of cards) {
    await tx.store.put({
      id: crypto.randomUUID(),
      front: c.front,
      back: c.back,
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: Date.now(), 
    });
  }
  await tx.done;
}

export async function getDueCards(): Promise<Flashcard[]> {
  if (!dbPromise) return [];
  const db = await dbPromise;
  const now = Date.now();
  const index = db.transaction('cards').store.index('by-due');
  
  const allCards = await index.getAll();
  return allCards.filter(c => c.dueDate <= now);
}

export async function updateCard(card: Flashcard) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put('cards', card);
}
