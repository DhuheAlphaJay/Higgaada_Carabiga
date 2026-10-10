"use client";

import { motion, useAnimationControls } from "framer-motion";
import { Lightbulb, Undo2, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Celebration } from "@/components/game/Celebration";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { FeedbackBanner } from "@/components/game/FeedbackBanner";
import { GameHeader } from "@/components/game/GameHeader";
import { LetterBubble } from "@/components/game/LetterBubble";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { playCorrect, playPop, playWrong, safePlay } from "@/lib/audio";
import { arabicLetterSound, PRAISE, speakSequence, TRY_AGAIN, speakVocalized } from "@/lib/arabicSpeech";
import { copy } from "@/lib/copy";
import { shuffle } from "@/lib/random";
import { bubbleForToken, createLetterBank, type BankItem } from "@/lib/rounds";
import { useLessons } from "@/components/game/useLessons";
import { tileFace } from "@/lib/data/curriculum";
import { readLessonLevel, readSpellWord } from "@/lib/session";
import { addLesson, addStars } from "@/lib/profiles";
import type { LetterDoc, WordDoc } from "@/lib/data/lessonsData";

type PlacedLetter = {
  id: string;
  token: string;
  face: string;
};

function pointInElement(element: HTMLElement | null, point: { x: number; y: number }) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function freshBank(nextWords: WordDoc[], index: number, alphabet: LetterDoc[]) {
  const nextWord = nextWords[index];
  return nextWord ? createLetterBank(nextWord, alphabet) : [];
}

export function SpellGame() {
  const lessons = useLessons();
  const { letters, words } = lessons;
  const [queue, setQueue] = useState<WordDoc[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [bank, setBank] = useState<BankItem[]>([]);
  const [placed, setPlaced] = useState<PlacedLetter[]>([]);
  const [phase, setPhase] = useState<"build" | "success" | "done">("build");
  const [shake, setShake] = useState<{ id: string; tick: number } | null>(null);
  const [hintId, setHintId] = useState<string | null>(null);
  const [burstId, setBurstId] = useState(0);
  const [started, setStarted] = useState(false);
  const slotsRef = useRef<HTMLDivElement>(null);
  const slotControls = useAnimationControls();
  const lock = useRef(false);
  const spoke = useRef(false);

  const word = queue[wordIndex];
  const usedIds = new Set(placed.map((entry) => entry.id));
  const level = lessons.ready ? readLessonLevel() : null;
  const pool = level ? words.filter((item) => item.level === level) : words;

  if (lessons.ready && !started) {
    setStarted(true);
    if (pool.length > 0) {
      const storedId = readSpellWord();
      const preferred = pool.find((item) => item.id === storedId);
      const rest = shuffle(pool.filter((item) => item.id !== preferred?.id));
      const nextQueue = preferred ? [preferred, ...rest] : shuffle(pool);
      setQueue(nextQueue);
      setWordIndex(0);
      setBank(freshBank(nextQueue, 0, letters));
      setPlaced([]);
      setHintId(null);
      setShake(null);
      setPhase("build");
    }
  }

  useEffect(() => {
    if (!started || spoke.current || queue.length === 0) return;
    spoke.current = true;
    const storedId = readSpellWord();
    const first = queue[0];
    if (storedId || !first) return;
    speakVocalized(first.letters, first.word);
  }, [started, queue]);

  function shakeSlots() {
    void slotControls.start({
      x: [0, -10, 10, -6, 6, 0],
      transition: { duration: 0.4 },
    });
  }

  function attempt(item: BankItem) {
    if (!word || lock.current || phase !== "build" || usedIds.has(item.id)) return;

    const expected = word.letters[placed.length];
    if (item.token !== expected) {
      setShake((current) => ({ id: item.id, tick: (current?.tick ?? 0) + 1 }));
      setHintId(null);
      shakeSlots();
      safePlay(playWrong);
      speakSequence([arabicLetterSound(item.token), TRY_AGAIN]);
      return;
    }

    const nextPlaced = [...placed, item];
    setPlaced(nextPlaced);
    setHintId(null);

    if (nextPlaced.length === word.letters.length) {
      lock.current = true;
      setPhase("success");
      setBurstId((value) => value + 1);
      addStars(1);
      addLesson();
      speakSequence([arabicLetterSound(item.token), PRAISE]);
      safePlay(playCorrect);
      return;
    }

    speakSequence([arabicLetterSound(item.token)]);
    safePlay(playPop);
  }

  function undo() {
    if (phase !== "build" || placed.length === 0) return;
    setPlaced((current) => current.slice(0, -1));
    setHintId(null);
  }

  function showHint() {
    if (!word || phase !== "build") return;
    const expected = word.letters[placed.length];
    const match = bank.find((item) => item.token === expected && !usedIds.has(item.id));
    setHintId(match?.id ?? null);
  }

  function speakWord() {
    if (!word) return;
    speakVocalized(word.letters, word.word);
  }

  function beginWord(nextQueue: WordDoc[], index: number) {
    setQueue(nextQueue);
    setWordIndex(index);
    setBank(freshBank(nextQueue, index, letters));
    setPlaced([]);
    setHintId(null);
    setShake(null);
    setPhase("build");
    lock.current = false;
  }

  function nextWord() {
    if (wordIndex + 1 >= queue.length) {
      setPhase("done");
      return;
    }

    const upcoming = queue[wordIndex + 1];
    beginWord(queue, wordIndex + 1);
    if (upcoming) speakVocalized(upcoming.letters, upcoming.word);
  }

  function replay() {
    if (pool.length === 0) return;
    setBurstId(0);
    const nextWords = shuffle(pool);
    beginWord(nextWords, 0);
    if (nextWords[0]) speakVocalized(nextWords[0].letters, nextWords[0].word);
  }

  const feedback =
    phase === "success"
      ? { tone: "success" as const, message: copy.spelled }
      : shake
        ? { tone: "retry" as const, message: copy.wrong }
        : { tone: null, message: null };

  return (
    <main dir="ltr" className="play-bg mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6">
      <ConfettiBurst burstId={burstId} />
      <GameHeader
        title={copy.spellTitle}
        progress={phase === "done" || !word ? undefined : `${wordIndex + 1} / ${queue.length}`}
        backHref={level ? `/learn/${level}` : "/"}
      />

      {!started ? (
        <p dir="ltr" className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">
          Waa la diyaarinayaa...
        </p>
      ) : queue.length === 0 ? (
        <p dir="ltr" className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">
          {copy.noWords}
        </p>
      ) : phase === "done" || !word ? (
        <Celebration title="Hambalyo!" body={copy.spellDone} onReplay={replay} />
      ) : (
        <>
          <section className="rounded-3xl bg-white/85 px-4 py-5 text-center shadow-xl ring-1 ring-white">
            <p dir="ltr" className="text-sm font-extrabold text-orange-700 sm:text-base">{copy.spellHint}</p>
            <p className="mt-2 text-5xl" aria-hidden="true">
              {word.image}
            </p>
            <p dir="ltr" className="text-2xl font-black text-indigo-950">{word.meaning}</p>
            <p dir="ltr" className="text-sm font-extrabold text-orange-700">
              {word.difficulty === "easy" ? copy.easy : copy.medium}
            </p>
            <div className="letter-slots mt-3 gap-2">
              {word.letters.map((token, index) => {
                const focused = word.focus.includes(index);
                return (
                  <button
                    key={`${word.id}-piece-${index}`}
                    type="button"
                    onClick={() => speakSequence([arabicLetterSound(token)])}
                    className={`pressable flex h-16 min-w-14 items-center justify-center rounded-2xl px-2 text-3xl font-black sm:h-20 sm:min-w-16 sm:text-4xl ${
                      focused ? "bg-white text-red-600 ring-4 ring-red-300" : "bg-indigo-50 text-indigo-950"
                    }`}
                  >
                    <span lang="ar" dir="rtl">
                      {tileFace(token, index, word.letters)}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center">
              <BubblyButton tone="amber" onClick={speakWord} aria-label={`${copy.listen} ${word.meaning}`}>
                <Volume2 className="size-6" aria-hidden="true" />
                {copy.listen}
              </BubblyButton>
            </div>
          </section>

          <motion.div
            ref={slotsRef}
            animate={slotControls}
            className={`letter-slots min-h-24 gap-2 rounded-3xl px-3 py-3 ${
              phase === "success" ? "bg-amber-100 ring-4 ring-amber-300" : "bg-indigo-950/5"
            }`}
            aria-label={word.word}
          >
            {word.letters.map((_, index) => {
              const filled = placed[index];
              const focused = word.focus.includes(index);
              return (
                <div
                  key={`${word.id}-${index}`}
                  className={`flex h-20 w-16 items-center justify-center rounded-3xl text-3xl font-black leading-none sm:h-24 sm:w-20 sm:text-4xl ${
                    filled
                      ? focused
                        ? "bg-white text-red-600 shadow-[0_6px_0_0_#e11d48] ring-4 ring-red-300"
                        : phase === "success"
                          ? "bg-amber-300 text-indigo-950 shadow-[0_6px_0_0_#d97706]"
                          : "bg-white text-indigo-950 shadow-[0_6px_0_0_#c4b5fd]"
                      : focused
                        ? "border-4 border-dashed border-red-400 bg-red-50"
                        : "border-4 border-dashed border-indigo-300 bg-white/60"
                  }`}
                >
                  {filled ? (
                    <motion.span lang="ar" dir="rtl" initial={{ scale: 0.4, y: 10 }} animate={{ scale: 1, y: 0 }}>
                      {filled.face}
                    </motion.span>
                  ) : (
                    <span className="sr-only">Boos madhan {index + 1}</span>
                  )}
                </div>
              );
            })}
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {bank.map((item) => (
              <LetterBubble
                key={item.id}
                label={item.face}
                ariaLabel={item.token}
                bubble={bubbleForToken(item.token, letters)}
                disabled={phase !== "build" || usedIds.has(item.id)}
                dimmed={usedIds.has(item.id)}
                shaking={shake?.id === item.id}
                shakeTick={shake?.id === item.id ? shake.tick : 0}
                highlighted={hintId === item.id && !usedIds.has(item.id)}
                enableDrag={phase === "build" && !usedIds.has(item.id)}
                onPress={() => attempt(item)}
                onDragRelease={(point) => {
                  if (pointInElement(slotsRef.current, point)) attempt(item);
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <BubblyButton tone="rose" onClick={undo} disabled={phase !== "build" || placed.length === 0}>
              <Undo2 className="size-5" aria-hidden="true" />
              {copy.undo}
            </BubblyButton>
            <BubblyButton tone="amber" onClick={showHint} disabled={phase !== "build"}>
              <Lightbulb className="size-5" aria-hidden="true" />
              {copy.hint}
            </BubblyButton>
          </div>

          <FeedbackBanner tone={feedback.tone} message={feedback.message} />

          {phase === "success" ? (
            <BubblyButton tone="emerald" onClick={nextWord} className="w-full">
              {wordIndex + 1 >= queue.length ? copy.finish : copy.next}
            </BubblyButton>
          ) : null}
        </>
      )}
    </main>
  );
}
