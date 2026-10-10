"use client";

import { Volume2 } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Celebration } from "@/components/game/Celebration";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { FeedbackBanner } from "@/components/game/FeedbackBanner";
import { GameHeader } from "@/components/game/GameHeader";
import { TashkeelWord } from "@/components/game/TashkeelWord";
import { useLessons } from "@/components/game/useLessons";
import { playCorrect, playWrong, safePlay } from "@/lib/audio";
import { speakPraise, speakTryAgain, speakVocalized } from "@/lib/arabicSpeech";
import { copy } from "@/lib/copy";
import { chapterById } from "@/lib/data/curriculum";
import type { WordDoc } from "@/lib/data/lessonsData";
import { addLesson, addStars } from "@/lib/profiles";
import { shuffle } from "@/lib/random";
import { LISTEN_ROUNDS, createWordListenRound, type WordListenRound } from "@/lib/rounds";
import { readListenWord } from "@/lib/session";

const cardTones = [
  "bg-sky-500 text-white shadow-[0_6px_0_0_#0369a1]",
  "bg-rose-500 text-white shadow-[0_6px_0_0_#be123c]",
  "bg-amber-400 text-indigo-950 shadow-[0_6px_0_0_#d97706]",
  "bg-emerald-500 text-white shadow-[0_6px_0_0_#047857]",
];

export function ChapterListenGame({ level }: { level: string }) {
  const chapter = chapterById(level);
  const { words, ready } = useLessons();
  const pool = useMemo(
    () => (chapter ? words.filter((word) => word.level === chapter.id) : []),
    [chapter, words],
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<WordListenRound | null>(null);
  const [phase, setPhase] = useState<"play" | "success" | "done">("play");
  const [tried, setTried] = useState<string[]>([]);
  const [shake, setShake] = useState<{ id: string; tick: number } | null>(null);
  const [burstId, setBurstId] = useState(0);
  const lock = useRef(false);
  const advanceTimer = useRef<number | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!ready || !chapter || booted.current || pool.length === 0) return;
    booted.current = true;
    const storedId = readListenWord();
    const stored = pool.find((word) => word.id === storedId);
    const opening = stored ? roundForTarget(pool, stored) : createWordListenRound(pool);
    setRound(opening);
    if (!storedId) speakVocalized(opening.target.letters, opening.target.word);
  }, [ready, chapter, pool]);

  function playPrompt() {
    if (!round) return;
    speakVocalized(round.target.letters, round.target.word);
  }

  function handlePick(word: WordDoc) {
    if (!round || lock.current || phase !== "play" || tried.includes(word.id)) return;

    if (word.id === round.target.id) {
      lock.current = true;
      setPhase("success");
      setBurstId((value) => value + 1);
      const isLast = roundIndex + 1 >= LISTEN_ROUNDS;
      addStars(1);
      if (isLast) addLesson();
      safePlay(playCorrect);

      let moved = false;
      const goNext = () => {
        if (moved) return;
        moved = true;
        if (advanceTimer.current !== null) {
          window.clearTimeout(advanceTimer.current);
          advanceTimer.current = null;
        }
        if (isLast) {
          setPhase("done");
          return;
        }
        const next = createWordListenRound(pool, word.id);
        setRound(next);
        setRoundIndex((value) => value + 1);
        setPhase("play");
        setTried([]);
        setShake(null);
        lock.current = false;
        speakVocalized(next.target.letters, next.target.word);
      };

      advanceTimer.current = window.setTimeout(goNext, 3200);
      speakPraise(goNext);
      return;
    }

    setTried((current) => [...current, word.id]);
    setShake((current) => ({ id: word.id, tick: (current?.tick ?? 0) + 1 }));
    speakTryAgain();
    safePlay(playWrong);
  }

  function replay() {
    if (pool.length === 0) return;
    const next = createWordListenRound(pool);
    setRound(next);
    setRoundIndex(0);
    setPhase("play");
    setTried([]);
    setShake(null);
    setBurstId(0);
    lock.current = false;
    speakVocalized(next.target.letters, next.target.word);
  }

  const feedback =
    phase === "success"
      ? { tone: "success" as const, message: copy.correct }
      : shake
        ? { tone: "retry" as const, message: copy.wrong }
        : { tone: null, message: null };

  const backHref = chapter ? (`/learn/${chapter.id}` as const) : "/";

  return (
    <main dir="ltr" className="play-bg mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6">
      <ConfettiBurst burstId={burstId} />
      <GameHeader
        title={copy.listenTitle}
        progress={phase === "done" || !round ? undefined : `${roundIndex + 1} / ${LISTEN_ROUNDS}`}
        backHref={backHref}
      />

      {!ready || (!round && pool.length > 0) ? (
        <p className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">Waa la diyaarinayaa...</p>
      ) : pool.length === 0 ? (
        <p className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">{copy.noWords}</p>
      ) : phase === "done" ? (
        <Celebration title="Hambalyo!" body={copy.listenDone} onReplay={replay} />
      ) : !round ? (
        <p className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">Waa la diyaarinayaa...</p>
      ) : (
        <>
          <section className="rounded-3xl bg-white/85 px-4 py-6 text-center shadow-xl ring-1 ring-white">
            <p className="text-sm font-extrabold text-sky-800 sm:text-base">{copy.listenWordHint}</p>
            <motion.button
              type="button"
              onClick={playPrompt}
              aria-label={copy.listen}
              className="pressable edge-sky relative mx-auto mt-4 flex h-36 w-36 flex-col items-center justify-center rounded-full bg-sky-500 text-white sm:h-40 sm:w-40"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-2 rounded-full border-4 border-white/70"
                animate={{ scale: [1, 1.12, 1], opacity: [0.9, 0.35, 0.9] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-5xl" aria-hidden="true">
                😊
              </span>
              <Volume2 className="relative size-8" aria-hidden="true" />
            </motion.button>
            <p className="mt-4 text-lg font-black text-indigo-950">Dhageyso, kadibna dooro.</p>
          </section>

          <div className="grid grid-cols-2 gap-3">
            {round.options.map((word, index) => (
              <WordCard
                key={word.id}
                word={word}
                tone={cardTones[index % cardTones.length]}
                disabled={phase !== "play" || tried.includes(word.id)}
                dimmed={tried.includes(word.id)}
                shaking={shake?.id === word.id}
                shakeTick={shake?.id === word.id ? shake.tick : 0}
                highlighted={phase === "success" && word.id === round.target.id}
                onPress={() => handlePick(word)}
              />
            ))}
          </div>

          <FeedbackBanner tone={feedback.tone} message={feedback.message} />
        </>
      )}
    </main>
  );
}

function roundForTarget(words: readonly WordDoc[], target: WordDoc): WordListenRound {
  const distractors = shuffle(words.filter((word) => word.id !== target.id)).slice(0, 3);
  return {
    target,
    options: shuffle([target, ...distractors]),
  };
}

function WordCard({
  word,
  tone,
  disabled,
  dimmed,
  shaking,
  shakeTick,
  highlighted,
  onPress,
}: {
  word: WordDoc;
  tone: string;
  disabled: boolean;
  dimmed: boolean;
  shaking: boolean;
  shakeTick: number;
  highlighted: boolean;
  onPress: () => void;
}) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (!shaking || shakeTick === 0) return;
    void controls.start({
      x: [0, -14, 14, -10, 10, -5, 5, 0],
      transition: { duration: 0.45 },
    });
  }, [controls, shakeTick, shaking]);

  return (
    <motion.button
      type="button"
      animate={controls}
      whileTap={disabled ? undefined : { y: 4, scale: 0.98 }}
      disabled={disabled}
      onClick={onPress}
      aria-label={word.word}
      className={`pressable flex min-h-28 items-center justify-center rounded-3xl px-3 py-4 ${tone} ${
        dimmed ? "opacity-40" : ""
      } ${highlighted ? "ring-4 ring-amber-200 ring-offset-2 ring-offset-orange-50" : ""}`}
    >
      <span className="rounded-2xl bg-white px-3 py-2">
        <TashkeelWord letters={word.letters} focus={word.focus} className="text-3xl font-black text-indigo-950 sm:text-4xl" />
      </span>
    </motion.button>
  );
}
