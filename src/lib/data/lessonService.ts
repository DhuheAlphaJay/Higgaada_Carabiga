import { readLessons } from "@/lib/data/lessonStore";
import type { LetterDoc, WordDoc } from "@/lib/data/lessonsData";

/** Reads the live lesson snapshot. On the server this is the seed catalog. */
export async function getLettersCollection(): Promise<LetterDoc[]> {
  return readLessons().letters;
}

export async function getWordsCollection(): Promise<WordDoc[]> {
  return readLessons().words;
}
