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

/** Firestore-shaped word collection. Swap this array for a `words` query later. */
export const wordsCollection: WordDoc[] = [
  { id: "muhammad", word: "مُحَمَّد", meaning: "Muxammad", letters: ["مُ", "حَ", "مَّ", "د"], image: "⭐", difficulty: "medium" },
  { id: "kitaab", word: "كِتَاب", meaning: "Buug", letters: ["كِ", "تَ", "ا", "ب"], image: "📚", difficulty: "medium" },
  { id: "qalam", word: "قَلَم", meaning: "Qalin", letters: ["قَ", "لَ", "م"], image: "✏️", difficulty: "easy" },
  { id: "bayt", word: "بَيْت", meaning: "Guri", letters: ["بَ", "يْ", "ت"], image: "🏠", difficulty: "easy" },
  { id: "shams", word: "شَمْس", meaning: "Qorrax", letters: ["شَ", "مْ", "س"], image: "☀️", difficulty: "easy" },
  { id: "qamar", word: "قَمَر", meaning: "Dayax", letters: ["قَ", "مَ", "ر"], image: "🌙", difficulty: "easy" },
  { id: "walad", word: "وَلَد", meaning: "Wiil", letters: ["وَ", "لَ", "د"], image: "👦", difficulty: "easy" },
  { id: "bint", word: "بِنْت", meaning: "Gabadh", letters: ["بِ", "نْ", "ت"], image: "👧", difficulty: "easy" },
];
