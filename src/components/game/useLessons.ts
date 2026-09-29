"use client";

import { useSyncExternalStore } from "react";
import { readLessons, subscribeLessons, type LessonState } from "@/lib/data/lessonStore";
import { lettersCollection, wordsCollection } from "@/lib/data/lessonsData";

const serverLessons: LessonState = {
  letters: lettersCollection,
  words: wordsCollection,
  ready: false,
};

export function useLessons() {
  return useSyncExternalStore(subscribeLessons, readLessons, () => serverLessons);
}
