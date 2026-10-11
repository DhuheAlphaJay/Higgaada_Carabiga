import { focusForLevel, inferLessonLevel, isLessonLevel, splitArabicTiles, type LessonLevel } from "@/lib/data/curriculum";
import { lettersCollection, wordsCollection, type LetterDoc, type WordDifficulty, type WordDoc } from "@/lib/data/lessonsData";

export type LessonState = {
  letters: LetterDoc[];
  words: WordDoc[];
  ready: boolean;
};

export type WordInput = {
  word: string;
  meaning: string;
  image: string;
  difficulty: WordDifficulty;
  level: LessonLevel;
};

export type LetterInput = {
  letter: string;
  name: string;
  distractors: string[];
};

const STORAGE_KEY = "xuruuf-lessons";
const VERSION_KEY = "xuruuf-curriculum-version";
const CURRICULUM_VERSION = 2;
const CHANGE_EVENT = "xuruuf-lessons-change";

const serverSnapshot: LessonState = {
  letters: lettersCollection,
  words: wordsCollection,
  ready: false,
};

let snapshot: LessonState = serverSnapshot;
let loaded = false;

function isDifficulty(value: unknown): value is WordDifficulty {
  return value === "easy" || value === "medium";
}

function parseLetters(value: unknown): LetterDoc[] | null {
  if (!Array.isArray(value)) return null;
  const letters = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const letter = item as Partial<LetterDoc>;
    if (typeof letter.id !== "string" || typeof letter.letter !== "string" || typeof letter.name !== "string") {
      return [];
    }
    const distractors = Array.isArray(letter.distractors)
      ? letter.distractors.filter((id): id is string => typeof id === "string").slice(0, 3)
      : [];
    return [
      {
        id: letter.id,
        letter: letter.letter,
        name: letter.name,
        audio: typeof letter.audio === "string" ? letter.audio : letter.id,
        distractors,
      },
    ];
  });
  return letters;
}

function parseWords(value: unknown): WordDoc[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const word = item as Partial<WordDoc>;
    if (typeof word.id !== "string" || typeof word.word !== "string" || typeof word.meaning !== "string") return [];
    const letters = Array.isArray(word.letters) ? word.letters.filter((token): token is string => typeof token === "string") : [];
    if (letters.length === 0) return [];
    const level = isLessonLevel(word.level) ? word.level : inferLessonLevel(letters);
    const focus = Array.isArray(word.focus)
      ? word.focus.filter((index): index is number => typeof index === "number" && index >= 0 && index < letters.length)
      : [];
    return [
      {
        id: word.id,
        word: word.word,
        meaning: word.meaning,
        letters,
        image: typeof word.image === "string" && word.image.trim() ? word.image : "⭐",
        difficulty: isDifficulty(word.difficulty) ? word.difficulty : "easy",
        level,
        focus: focus.length > 0 ? focus : focusForLevel(letters, level),
      },
    ];
  });
}

function loadFromStorage(): LessonState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { letters?: unknown; words?: unknown };
    const letters = parseLetters(data.letters);
    const words = parseWords(data.words);
    if (!letters || !words) return null;
    return { letters, words, ready: true };
  } catch {
    return null;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const stored = loadFromStorage();
  if (stored && readCurriculumVersion() < CURRICULUM_VERSION) {
    const next = withCatalog(stored.letters, stored.words);
    snapshot = { ...next, ready: true };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ letters: next.letters, words: next.words }));
      window.localStorage.setItem(VERSION_KEY, String(CURRICULUM_VERSION));
    } catch {
      snapshot = { ...next, ready: true };
    }
    return;
  }
  if (readCurriculumVersion() < CURRICULUM_VERSION) {
    try {
      window.localStorage.setItem(VERSION_KEY, String(CURRICULUM_VERSION));
    } catch {
      /* The catalog still loads from memory when storage is blocked. */
    }
  }
  snapshot = stored ?? {
    letters: lettersCollection,
    words: wordsCollection,
    ready: true,
  };
}

function readCurriculumVersion() {
  const value = Number(window.localStorage.getItem(VERSION_KEY));
  return Number.isFinite(value) ? value : 0;
}

export function withCatalog(letters: LetterDoc[], words: WordDoc[]) {
  return {
    letters: mergeById(letters, lettersCollection),
    words: mergeById(words, wordsCollection),
  };
}

function mergeById<T extends { id: string }>(current: T[], catalog: readonly T[]) {
  const ids = new Set(current.map((item) => item.id));
  const added = catalog.filter((item) => !ids.has(item.id));
  return added.length > 0 ? [...current, ...added] : current;
}

function commit(next: LessonState, options?: { remote?: boolean }) {
  snapshot = { ...next, ready: true };
  loaded = true;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ letters: snapshot.letters, words: snapshot.words }),
    );
  } catch {
    snapshot = { ...next, ready: true };
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  if (!options?.remote) scheduleLessonPush();
}

function scheduleLessonPush() {
  void import("@/lib/firebase")
    .then((firebase) => {
      if (!firebase.isFirebaseConfigured()) return;
      return import("@/lib/sync/cloud").then((cloud) => {
        cloud.markLessonsDirty();
        return cloud.pushLessons();
      });
    })
    .catch(() => undefined);
}

export function readLessons() {
  ensureLoaded();
  return snapshot;
}

export function subscribeLessons(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    loaded = false;
    ensureLoaded();
    onStoreChange();
  };

  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function replaceLessons(next: Pick<LessonState, "letters" | "words">) {
  commit({ letters: next.letters, words: next.words, ready: true }, { remote: true });
}

function uniqueId(base: string, ids: string[]) {
  const cleaned = base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const root = cleaned || "cashar";
  const taken = new Set(ids);
  if (!taken.has(root)) return root;
  let count = 2;
  while (taken.has(`${root}-${count}`)) count += 1;
  return `${root}-${count}`;
}

export function addWord(input: WordInput) {
  const word = input.word.trim();
  const letters = splitArabicTiles(word);
  const meaning = input.meaning.trim();
  if (!word || letters.length === 0 || !meaning) return null;

  const state = readLessons();
  const doc: WordDoc = {
    id: uniqueId(meaning, state.words.map((item) => item.id)),
    word,
    meaning,
    letters,
    image: input.image.trim() || "⭐",
    difficulty: input.difficulty,
    level: input.level,
    focus: focusForLevel(letters, input.level),
  };
  commit({ ...state, words: [...state.words, doc] });
  return doc;
}

export function updateWord(id: string, input: WordInput) {
  const word = input.word.trim();
  const letters = splitArabicTiles(word);
  const meaning = input.meaning.trim();
  if (!word || letters.length === 0 || !meaning) return false;

  const state = readLessons();
  if (!state.words.some((item) => item.id === id)) return false;
  commit({
    ...state,
    words: state.words.map((item) =>
      item.id === id
        ? {
            ...item,
            word,
            meaning,
            letters,
            image: input.image.trim() || "⭐",
            difficulty: input.difficulty,
            level: input.level,
            focus: focusForLevel(letters, input.level),
          }
        : item,
    ),
  });
  return true;
}

export function deleteWord(id: string) {
  const state = readLessons();
  commit({ ...state, words: state.words.filter((item) => item.id !== id) });
}

export function addLetter(input: LetterInput) {
  const letter = input.letter.trim();
  const name = input.name.trim();
  if (!letter || !name) return null;

  const state = readLessons();
  const id = uniqueId(name, state.letters.map((item) => item.id));
  const distractors = cleanDistractors(input.distractors, id, state.letters);
  const doc: LetterDoc = { id, letter, name, audio: id, distractors };
  commit({ ...state, letters: [...state.letters, doc] });
  return doc;
}

export function updateLetter(id: string, input: LetterInput) {
  const letter = input.letter.trim();
  const name = input.name.trim();
  if (!letter || !name) return false;

  const state = readLessons();
  if (!state.letters.some((item) => item.id === id)) return false;
  const distractors = cleanDistractors(input.distractors, id, state.letters);
  commit({
    ...state,
    letters: state.letters.map((item) =>
      item.id === id ? { ...item, letter, name, audio: item.audio || id, distractors } : item,
    ),
  });
  return true;
}

export function deleteLetter(id: string) {
  const state = readLessons();
  commit({
    ...state,
    letters: state.letters
      .filter((item) => item.id !== id)
      .map((item) => ({ ...item, distractors: item.distractors.filter((choice) => choice !== id) })),
  });
}

function cleanDistractors(ids: string[], selfId: string, letters: LetterDoc[]) {
  const known = new Set(letters.map((item) => item.id));
  const unique: string[] = [];
  ids.forEach((id) => {
    if (id === selfId || !known.has(id) || unique.includes(id) || unique.length >= 3) return;
    unique.push(id);
  });
  return unique;
}
