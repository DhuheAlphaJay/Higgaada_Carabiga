const LISTEN_TARGET_KEY = "xuruuf-listen-target";
const LISTEN_WORD_KEY = "xuruuf-listen-word";
const SPELL_WORD_KEY = "xuruuf-spell-word";
const LESSON_LEVEL_KEY = "xuruuf-lesson-level";

let listenTargetCache: string | null | undefined;
let listenWordCache: string | null | undefined;
let spellWordCache: string | null | undefined;

function remember(key: string, id: string, clearCache: () => void) {
  clearCache();
  window.sessionStorage.setItem(key, id);
}

function readOnce(key: string, cache: string | null | undefined, save: (value: string | null) => void) {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(key);
  window.sessionStorage.removeItem(key);
  save(value);
  return value;
}

export function rememberListenTarget(id: string) {
  remember(LISTEN_TARGET_KEY, id, () => {
    listenTargetCache = undefined;
  });
}

export function readListenTarget() {
  return readOnce(LISTEN_TARGET_KEY, listenTargetCache, (value) => {
    listenTargetCache = value;
  });
}

export function rememberListenWord(id: string) {
  remember(LISTEN_WORD_KEY, id, () => {
    listenWordCache = undefined;
  });
}

export function readListenWord() {
  return readOnce(LISTEN_WORD_KEY, listenWordCache, (value) => {
    listenWordCache = value;
  });
}

export function rememberSpellWord(id: string) {
  remember(SPELL_WORD_KEY, id, () => {
    spellWordCache = undefined;
  });
}

export function readSpellWord() {
  return readOnce(SPELL_WORD_KEY, spellWordCache, (value) => {
    spellWordCache = value;
  });
}

export function rememberLessonLevel(level: string) {
  window.sessionStorage.setItem(LESSON_LEVEL_KEY, level);
}

export function readLessonLevel() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(LESSON_LEVEL_KEY);
}
