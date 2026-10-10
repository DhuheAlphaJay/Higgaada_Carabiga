import type { LessonLevel } from "@/lib/data/curriculum";

export type LetterDoc = {
  id: string;
  letter: string;
  name: string;
  audio: string;
  distractors: string[];
};

export type WordDifficulty = "easy" | "medium";

export type WordDoc = {
  id: string;
  word: string;
  meaning: string;
  letters: string[];
  image: string;
  difficulty: WordDifficulty;
  level: LessonLevel;
  focus: number[];
};

/** Firestore-shaped letter collection. Swap this array for a `letters` query later. */
export const lettersCollection: LetterDoc[] = [
  { id: "alif", letter: "ا", name: "Alif", audio: "alif", distractors: ["laam", "kaaf", "baa"] },
  { id: "baa", letter: "ب", name: "Baa", audio: "baa", distractors: ["taa", "thaa", "nuun"] },
  { id: "taa", letter: "ت", name: "Taa", audio: "taa", distractors: ["baa", "thaa", "yaa"] },
  { id: "thaa", letter: "ث", name: "Thaa", audio: "thaa", distractors: ["taa", "baa", "shiin"] },
  { id: "jiim", letter: "ج", name: "Jiim", audio: "jiim", distractors: ["haa", "khaa", "ayn"] },
  { id: "haa", letter: "ح", name: "Xaa", audio: "haa", distractors: ["jiim", "khaa", "ayn"] },
  { id: "khaa", letter: "خ", name: "Khaa", audio: "khaa", distractors: ["jiim", "haa", "ghayn"] },
  { id: "daal", letter: "د", name: "Daal", audio: "daal", distractors: ["dhaal", "raa", "waw"] },
  { id: "dhaal", letter: "ذ", name: "Dhaal", audio: "dhaal", distractors: ["daal", "zay", "raa"] },
  { id: "raa", letter: "ر", name: "Raa", audio: "raa", distractors: ["zay", "daal", "waw"] },
  { id: "zay", letter: "ز", name: "Zaay", audio: "zay", distractors: ["raa", "dhaal", "nuun"] },
  { id: "siin", letter: "س", name: "Siin", audio: "siin", distractors: ["shiin", "saad", "nuun"] },
  { id: "shiin", letter: "ش", name: "Shiin", audio: "shiin", distractors: ["siin", "thaa", "saad"] },
  { id: "saad", letter: "ص", name: "Saad", audio: "saad", distractors: ["daad", "siin", "tah"] },
  { id: "daad", letter: "ض", name: "Daad", audio: "daad", distractors: ["saad", "zah", "daal"] },
  { id: "tah", letter: "ط", name: "Taw", audio: "tah", distractors: ["zah", "saad", "baa"] },
  { id: "zah", letter: "ظ", name: "Dhaw", audio: "zah", distractors: ["tah", "daad", "dhaal"] },
  { id: "ayn", letter: "ع", name: "Cayn", audio: "ayn", distractors: ["ghayn", "haa", "jiim"] },
  { id: "ghayn", letter: "غ", name: "Ghayn", audio: "ghayn", distractors: ["ayn", "khaa", "faa"] },
  { id: "faa", letter: "ف", name: "Faa", audio: "faa", distractors: ["qaaf", "ghayn", "waw"] },
  { id: "qaaf", letter: "ق", name: "Qaaf", audio: "qaaf", distractors: ["faa", "kaaf", "ayn"] },
  { id: "kaaf", letter: "ك", name: "Kaaf", audio: "kaaf", distractors: ["laam", "qaaf", "alif"] },
  { id: "laam", letter: "ل", name: "Laam", audio: "laam", distractors: ["alif", "kaaf", "nuun"] },
  { id: "miim", letter: "م", name: "Miim", audio: "miim", distractors: ["nuun", "haa2", "baa"] },
  { id: "nuun", letter: "ن", name: "Nuun", audio: "nuun", distractors: ["baa", "taa", "miim"] },
  { id: "haa2", letter: "ه", name: "Haa", audio: "haa2", distractors: ["miim", "waw", "haa"] },
  { id: "waw", letter: "و", name: "Waaw", audio: "waw", distractors: ["raa", "daal", "faa"] },
  { id: "yaa", letter: "ي", name: "Yaa", audio: "yaa", distractors: ["baa", "taa", "nuun"] },
];

/** Firestore-shaped word collection. Each word belongs to one phonics chapter. */
export const wordsCollection: WordDoc[] = [
  { id: "ba-fatha", word: "بَ", meaning: "Ba", letters: ["بَ"], image: "🔤", difficulty: "easy", level: "harakat", focus: [0] },
  { id: "ba-kasra", word: "بِ", meaning: "Bi", letters: ["بِ"], image: "🔤", difficulty: "easy", level: "harakat", focus: [0] },
  { id: "ba-damma", word: "بُ", meaning: "Bu", letters: ["بُ"], image: "🔤", difficulty: "easy", level: "harakat", focus: [0] },
  { id: "kataba", word: "كَتَبَ", meaning: "Wuu qoray", letters: ["كَ", "تَ", "بَ"], image: "✍️", difficulty: "easy", level: "harakat", focus: [0, 1, 2] },
  { id: "jalasa", word: "جَلَسَ", meaning: "Wuu fadhiistay", letters: ["جَ", "لَ", "سَ"], image: "🪑", difficulty: "easy", level: "harakat", focus: [0, 1, 2] },
  { id: "dhahaba", word: "ذَهَبَ", meaning: "Wuu tegey", letters: ["ذَ", "هَ", "بَ"], image: "🚶", difficulty: "easy", level: "harakat", focus: [0, 1, 2] },
  { id: "qalam", word: "قَلَمُ", meaning: "Qalin", letters: ["قَ", "لَ", "مُ"], image: "✏️", difficulty: "easy", level: "harakat", focus: [0, 1, 2] },
  { id: "qamar", word: "قَمَرُ", meaning: "Dayax", letters: ["قَ", "مَ", "رُ"], image: "🌙", difficulty: "easy", level: "harakat", focus: [0, 1, 2] },
  { id: "walad", word: "وَلَدُ", meaning: "Wiil", letters: ["وَ", "لَ", "دُ"], image: "👦", difficulty: "easy", level: "harakat", focus: [0, 1, 2] },

  { id: "asadu", word: "أَصْعَدُ", meaning: "Waan fuulayaa", letters: ["أَ", "صْ", "عَ", "دُ"], image: "⛰️", difficulty: "medium", level: "sukoon", focus: [1] },
  { id: "yatbau", word: "يَطْبَعُ", meaning: "Wuu daabacaa", letters: ["يَ", "طْ", "بَ", "عُ"], image: "🖨️", difficulty: "medium", level: "sukoon", focus: [1] },
  { id: "yazlimu", word: "يَظْلِمُ", meaning: "Wuu dulmaa", letters: ["يَ", "ظْ", "لِ", "مُ"], image: "⚖️", difficulty: "medium", level: "sukoon", focus: [1] },
  { id: "yalamu", word: "يَعْلَمُ", meaning: "Wuu og yahay", letters: ["يَ", "عْ", "لَ", "مُ"], image: "💡", difficulty: "medium", level: "sukoon", focus: [1] },
  { id: "aghsilu", word: "أَغْسِلُ", meaning: "Waan mayraa", letters: ["أَ", "غْ", "سِ", "لُ"], image: "🧼", difficulty: "medium", level: "sukoon", focus: [1] },
  { id: "shams", word: "شَمْسُ", meaning: "Qorrax", letters: ["شَ", "مْ", "سُ"], image: "☀️", difficulty: "easy", level: "sukoon", focus: [1] },
  { id: "bayt", word: "بَيْتُ", meaning: "Guri", letters: ["بَ", "يْ", "تُ"], image: "🏠", difficulty: "easy", level: "sukoon", focus: [1] },
  { id: "bint", word: "بِنْتُ", meaning: "Gabadh", letters: ["بِ", "نْ", "تُ"], image: "👧", difficulty: "easy", level: "sukoon", focus: [1] },

  { id: "qaala", word: "قَالَ", meaning: "Wuu yidhi", letters: ["قَ", "ا", "لَ"], image: "💬", difficulty: "easy", level: "madd", focus: [1] },
  { id: "baab", word: "بَابُ", meaning: "Albaab", letters: ["بَ", "ا", "بُ"], image: "🚪", difficulty: "easy", level: "madd", focus: [1] },
  { id: "nuur", word: "نُورُ", meaning: "Iftiin", letters: ["نُ", "و", "رُ"], image: "✨", difficulty: "easy", level: "madd", focus: [1] },
  { id: "fii", word: "فِي", meaning: "Gudaha", letters: ["فِ", "ي"], image: "📍", difficulty: "easy", level: "madd", focus: [1] },
  { id: "kabiir", word: "كَبِيرُ", meaning: "Weyn", letters: ["كَ", "بِ", "ي", "رُ"], image: "🐘", difficulty: "medium", level: "madd", focus: [2] },
  { id: "kitaab", word: "كِتَابُ", meaning: "Buug", letters: ["كِ", "تَ", "ا", "بُ"], image: "📚", difficulty: "medium", level: "madd", focus: [2] },

  { id: "kitaabun", word: "كِتَابٌ", meaning: "Buug", letters: ["كِ", "تَ", "ا", "بٌ"], image: "📚", difficulty: "medium", level: "tanween", focus: [3] },
  { id: "qalamun", word: "قَلَمٌ", meaning: "Qalin", letters: ["قَ", "لَ", "مٌ"], image: "✏️", difficulty: "easy", level: "tanween", focus: [2] },
  { id: "baytin", word: "بَيْتٍ", meaning: "Guri", letters: ["بَ", "يْ", "تٍ"], image: "🏠", difficulty: "medium", level: "tanween", focus: [2] },
  { id: "waladan", word: "وَلَدًا", meaning: "Wiil", letters: ["وَ", "لَ", "دًا"], image: "👦", difficulty: "medium", level: "tanween", focus: [2] },
  { id: "bintun", word: "بِنْتٌ", meaning: "Gabadh", letters: ["بِ", "نْ", "تٌ"], image: "👧", difficulty: "medium", level: "tanween", focus: [2] },

  { id: "muhammad", word: "مُحَمَّدُ", meaning: "Muxammad", letters: ["مُ", "حَ", "مَّ", "دُ"], image: "⭐", difficulty: "medium", level: "shadda", focus: [2] },
  { id: "rabbi", word: "رَبِّ", meaning: "Eebbe", letters: ["رَ", "بِّ"], image: "🕌", difficulty: "easy", level: "shadda", focus: [1] },
  { id: "hajja", word: "حَجَّ", meaning: "Wuu xajiyay", letters: ["حَ", "جَّ"], image: "🕋", difficulty: "easy", level: "shadda", focus: [1] },
  { id: "ummi", word: "أُمِّي", meaning: "Hooyaday", letters: ["أُ", "مِّ", "ي"], image: "💛", difficulty: "medium", level: "shadda", focus: [1] },
  { id: "shadda", word: "شَدَّ", meaning: "Wuu adkeeyay", letters: ["شَ", "دَّ"], image: "💪", difficulty: "easy", level: "shadda", focus: [1] },
];
