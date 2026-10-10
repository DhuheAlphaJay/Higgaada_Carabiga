"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Ear } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TashkeelWord } from "@/components/game/TashkeelWord";
import { useLessons } from "@/components/game/useLessons";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { chapterById } from "@/lib/data/curriculum";
import type { WordDoc } from "@/lib/data/lessonsData";
import { speakVocalized } from "@/lib/arabicSpeech";
import { copy } from "@/lib/copy";
import { sampleOne } from "@/lib/random";
import { rememberLessonLevel, rememberListenWord, rememberSpellWord } from "@/lib/session";

export function ChapterView({ level }: { level: string }) {
  const chapter = chapterById(level);
  const lessons = useLessons();
  const router = useRouter();
  const words = chapter ? lessons.words.filter((word) => word.level === chapter.id) : [];

  if (!chapter) {
    return (
      <main className="play-bg mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6">
        <Link href="/" className="pressable edge-violet inline-flex min-h-12 w-fit items-center gap-1 rounded-full bg-violet-600 px-4 text-sm font-extrabold text-white">
          <ChevronLeft className="size-5" aria-hidden="true" />
          {copy.backHome}
        </Link>
        <p className="rounded-3xl bg-white px-4 py-6 text-center text-xl font-black text-indigo-950">{copy.noWords}</p>
      </main>
    );
  }

  function openSpell(word: WordDoc) {
    if (!chapter) return;
    rememberLessonLevel(chapter.id);
    rememberSpellWord(word.id);
    speakVocalized(word.letters, word.word);
    router.push("/spell");
  }

  function practice() {
    if (words.length === 0) return;
    openSpell(sampleOne(words));
  }

  function startListen() {
    if (!chapter || words.length === 0) return;
    const word = sampleOne(words);
    rememberLessonLevel(chapter.id);
    rememberListenWord(word.id);
    speakVocalized(word.letters, word.word);
    router.push(`/learn/${chapter.id}/listen`);
  }

  return (
    <main dir="ltr" className="play-bg mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
      <Link href="/" className="pressable edge-violet inline-flex min-h-12 w-fit items-center gap-1 rounded-full bg-violet-600 px-4 text-sm font-extrabold text-white">
        <ChevronLeft className="size-5" aria-hidden="true" />
        {copy.back}
      </Link>

      <header className="mt-5 text-center">
        <p className="text-sm font-extrabold text-violet-700">
          {copy.chapter} {chapter.order}
        </p>
        <h1 lang="ar" dir="rtl" className="mt-1 text-4xl font-black text-indigo-950 sm:text-5xl">
          {chapter.arabic}
        </h1>
        <p className="mt-2 text-lg font-bold text-indigo-900">{chapter.somali}</p>
        <p lang="ar" dir="rtl" className="mt-1 text-3xl font-black text-rose-600">
          {chapter.marks}
        </p>
      </header>

      <BubblyButton tone="amber" className="mt-6 w-full" onClick={practice} disabled={words.length === 0}>
        {copy.practiceChapter}
      </BubblyButton>

      {words.length === 0 ? (
        <p className="mt-4 rounded-3xl bg-white/90 px-4 py-6 text-center text-lg font-black text-indigo-950">{copy.noWords}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {words.map((word, index) => (
            <motion.li key={word.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <button
                type="button"
                onClick={() => openSpell(word)}
                className="pressable edge-soft flex min-h-28 w-full flex-col items-center justify-center rounded-3xl bg-white px-3 py-4 text-center"
              >
                <TashkeelWord letters={word.letters} focus={word.focus} className="text-4xl font-black text-indigo-950" />
                <span dir="ltr" className="mt-2 text-sm font-extrabold text-indigo-800">
                  {word.meaning}
                </span>
                <span className="mt-1 text-xs font-bold text-amber-700">{copy.buildWord}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={startListen}
        disabled={words.length === 0}
        className="pressable edge-sky mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sky-500 px-4 text-sm font-extrabold text-white disabled:opacity-50"
      >
        <Ear className="size-5" aria-hidden="true" />
        {copy.listenTitle}
      </button>
    </main>
  );
}
