export const lessonLevels = ["harakat", "sukoon", "madd", "tanween", "shadda"] as const;

export type LessonLevel = (typeof lessonLevels)[number];

export type Chapter = {
  id: LessonLevel;
  order: number;
  arabic: string;
  somali: string;
  marks: string;
  tone: string;
};

export const chapters: Chapter[] = [
  {
    id: "harakat",
    order: 1,
    arabic: "الحركات القصيرة",
    somali: "Fatha, kasra, iyo damma",
    marks: "َ ِ ُ",
    tone: "edge-sky bg-sky-500 text-white",
  },
  {
    id: "sukoon",
    order: 2,
    arabic: "السكون",
    somali: "Xarafka istaagaya",
    marks: "ْ",
    tone: "edge-rose bg-rose-500 text-white",
  },
  {
    id: "madd",
    order: 3,
    arabic: "حروف المد",
    somali: "Madd alif, waaw, iyo yaa",
    marks: "ا و ي",
    tone: "edge-amber bg-amber-400 text-indigo-950",
  },
  {
    id: "tanween",
    order: 4,
    arabic: "التنوين",
    somali: "Tanwiin fath, kasr, iyo damm",
    marks: "ً ٍ ٌ",
    tone: "edge-emerald bg-emerald-500 text-white",
  },
  {
    id: "shadda",
    order: 5,
    arabic: "الشدة",
    somali: "Xarafka laba-jibbaaran",
    marks: "ّ",
    tone: "edge-violet bg-violet-600 text-white",
  },
];

const SUKOON = "\u0652";
const SHADDA = "\u0651";
const TATWEEL = "\u0640";
const FATHA = "\u064E";
const DAMMA = "\u064F";
const KASRA = "\u0650";
const FATHATAN = "\u064B";
const DAMMATAN = "\u064C";
const KASRATAN = "\u064D";
const TANWEEN = /[\u064B\u064C\u064D]/;
const SHORT_VOWEL = /[\u064E\u064F\u0650]/;
const NOON_SUKOON = "ن\u0652";
const NON_JOINING = /[اأإآدذرزوؤءى]/;

export function isLessonLevel(value: unknown): value is LessonLevel {
  return lessonLevels.some((level) => level === value);
}

export function chapterById(id: string) {
  return chapters.find((chapter) => chapter.id === id) ?? null;
}

export function inferLessonLevel(letters: readonly string[]): LessonLevel {
  const text = letters.join("");
  if (text.includes(SHADDA)) return "shadda";
  if (TANWEEN.test(text)) return "tanween";
  if (text.includes(SUKOON)) return "sukoon";
  if (maddIndexes(letters).length > 0) return "madd";
  return "harakat";
}

export function focusForLevel(letters: readonly string[], level: LessonLevel) {
  if (level === "sukoon") return indexes(letters, (token) => token.includes(SUKOON));
  if (level === "shadda") return indexes(letters, (token) => token.includes(SHADDA));
  if (level === "tanween") return indexes(letters, (token) => TANWEEN.test(token));
  if (level === "madd") return maddIndexes(letters);
  const shorts = indexes(letters, (token) => SHORT_VOWEL.test(token) && !token.includes(SUKOON));
  return shorts.length > 0 ? shorts : [0];
}

/**
 * Tanween is a noon sound. Speech engines often skip the mark, so the spoken
 * form writes that noon: كِتَابٌ → كِتَابُنْ, وَلَدًا → وَلَدَنْ, بَيْتٍ → بَيْتِنْ.
 */
export function spokenSyllable(token: string) {
  const raw = token.replace(/\u0640/g, "");
  if (raw.includes(FATHATAN)) {
    const base = raw.replace(/[اأإآى]/g, "").split(FATHATAN).join("");
    return `${base || "ا"}${FATHA}${NOON_SUKOON}`;
  }
  if (raw.includes(DAMMATAN)) return `${raw.split(DAMMATAN).join(DAMMA)}${NOON_SUKOON}`;
  if (raw.includes(KASRATAN)) return `${raw.split(KASRATAN).join(KASRA)}${NOON_SUKOON}`;
  return raw;
}

const FATHATAN_SEAT = new Set(["ا", "أ", "إ", "آ", "ى"]);

/** One tile per letter, with its harakat. Tanween fath keeps its alif seat: وَلَدًا → وَ لَ دًا. */
export function splitArabicTiles(word: string) {
  const tiles: string[] = [];
  let current = "";
  for (const char of word) {
    if (isArabicMark(char)) {
      if (current) current += char;
      continue;
    }
    if (!isArabicBase(char)) continue;
    if (current.includes(FATHATAN) && FATHATAN_SEAT.has(char)) {
      current += char;
      continue;
    }
    if (current) tiles.push(current);
    current = char;
  }
  if (current) tiles.push(current);
  return tiles;
}

function isArabicBase(char: string) {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 0x0621 && code <= 0x063a) || (code >= 0x0641 && code <= 0x064a);
}

function isArabicMark(char: string) {
  const code = char.codePointAt(0) ?? 0;
  return code === 0x0640 || code === 0x0670 || (code >= 0x064b && code <= 0x0652);
}

/** Joining stroke so a tile shows the letter as it sits inside the word. */
export function tileFace(token: string, index: number, letters: readonly string[]) {
  if (index >= letters.length - 1) return token;
  const bare = token.replace(/[\u0640\u064B-\u0652\u0670]/g, "");
  if (NON_JOINING.test(bare) || token.includes(TATWEEL)) return token;
  return `${token}${TATWEEL}`;
}

/** Fully vocalized speech, with a pause drawn on the saakin letter. */
export function pacedSpeech(letters: readonly string[], fallback: string) {
  if (letters.length === 0) return fallback;
  let seenSukoon = false;
  let spoken = "";
  letters.forEach((token, index) => {
    const syllable = spokenSyllable(token);
    spoken += syllable;
    const sukoon = token.includes(SUKOON);
    const more = index < letters.length - 1;
    if (more && (sukoon || seenSukoon)) spoken += TATWEEL;
    if (sukoon) seenSukoon = true;
  });
  return spoken;
}

function indexes(letters: readonly string[], test: (token: string) => boolean) {
  return letters.flatMap((token, index) => (test(token) ? [index] : []));
}

function maddIndexes(letters: readonly string[]) {
  return letters.flatMap((token, index) => {
    const bare = token.replace(/[\u0640\u064B-\u0652\u0670]/g, "");
    if (bare !== "ا" && bare !== "و" && bare !== "ي" && bare !== "ى") return [];
    if (SHORT_VOWEL.test(token) || token.includes(SUKOON) || TANWEEN.test(token)) return [];
    return [index];
  });
}
