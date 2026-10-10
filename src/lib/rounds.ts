import type { BubbleStyle } from "@/types/content";
import { tileFace } from "@/lib/data/curriculum";
import type { LetterDoc, WordDoc } from "@/lib/data/lessonsData";
import { baseLetter } from "@/lib/arabic";
import { sampleOne, shuffle } from "@/lib/random";

export const LISTEN_ROUNDS = 5;

export type ListenRound = {
  target: LetterDoc;
  options: LetterDoc[];
};

export type BankItem = {
  id: string;
  token: string;
  face: string;
};

export type WordListenRound = {
  target: WordDoc;
  options: WordDoc[];
};

const palette: BubbleStyle[] = [
  { background: "#0284c7", edge: "#075985", text: "light" },
  { background: "#e11d48", edge: "#9f1239", text: "light" },
  { background: "#fbbf24", edge: "#d97706", text: "dark" },
  { background: "#059669", edge: "#047857", text: "light" },
  { background: "#7c3aed", edge: "#5b21b6", text: "light" },
  { background: "#ea580c", edge: "#c2410c", text: "light" },
  { background: "#db2777", edge: "#9d174d", text: "light" },
  { background: "#0891b2", edge: "#155e75", text: "light" },
];

export function createListenRound(letters: readonly LetterDoc[], excludeId?: string): ListenRound {
  const pool = letters.filter((letter) => letter.id !== excludeId);
  const target = sampleOne(pool.length > 0 ? pool : letters);
  return createListenRoundForTarget(letters, target);
}

export function createListenRoundForTarget(letters: readonly LetterDoc[], target: LetterDoc): ListenRound {
  const byId = new Map(letters.map((letter) => [letter.id, letter]));
  const preferred = target.distractors.flatMap((id) => {
    const letter = byId.get(id);
    return letter ? [letter] : [];
  });
  const rest = shuffle(
    letters.filter((letter) => letter.id !== target.id && !target.distractors.includes(letter.id)),
  );
  const distractors = [...preferred, ...rest].slice(0, 3);

  return {
    target,
    options: shuffle([target, ...distractors]),
  };
}

export function bubbleForLetter(letter: LetterDoc, letters: readonly LetterDoc[]): BubbleStyle {
  const index = Math.max(0, letters.findIndex((item) => item.id === letter.id));
  return palette[index % palette.length];
}

export function bubbleForToken(token: string, letters: readonly LetterDoc[]): BubbleStyle {
  const base = baseLetter(token);
  const match = letters.find((letter) => letter.letter === base);
  return match ? bubbleForLetter(match, letters) : palette[0];
}

export function createWordListenRound(words: readonly WordDoc[], excludeId?: string): WordListenRound {
  const pool = words.filter((word) => word.id !== excludeId);
  const target = sampleOne(pool.length > 0 ? pool : words);
  const distractors = shuffle(words.filter((word) => word.id !== target.id)).slice(0, 3);
  return {
    target,
    options: shuffle([target, ...distractors]),
  };
}

export function createLetterBank(word: WordDoc, letters: readonly LetterDoc[]): BankItem[] {
  const answers = word.letters.map((token, index) => ({
    id: `${word.id}-answer-${index}`,
    token,
    face: tileFace(token, index, word.letters),
  }));

  const usedBases = new Set(word.letters.map((token) => baseLetter(token)));
  const distractors = shuffle(letters.filter((letter) => !usedBases.has(letter.letter)))
    .slice(0, 3)
    .map((letter) => ({
      id: `${word.id}-extra-${letter.id}`,
      token: letter.letter,
      face: letter.letter,
    }));

  return shuffle([...answers, ...distractors]);
}
