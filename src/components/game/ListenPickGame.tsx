"use client";

import { Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Celebration } from "@/components/game/Celebration";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { FeedbackBanner } from "@/components/game/FeedbackBanner";
import { GameHeader } from "@/components/game/GameHeader";
import { LetterBubble } from "@/components/game/LetterBubble";
import { playCorrect, playWrong, safePlay } from "@/lib/audio";
import { speakLetterName, speakPraise, speakTryAgain } from "@/lib/arabicSpeech";
import { copy } from "@/lib/copy";
import { LISTEN_ROUNDS, bubbleForLetter, createListenRound, createListenRoundForTarget, type ListenRound } from "@/lib/rounds";
import { useLessons } from "@/components/game/useLessons";
import { readListenTarget } from "@/lib/session";
import type { LetterDoc } from "@/lib/data/lessonsData";
import { addLesson, addStars } from "@/lib/profiles";

export function ListenPickGame() {
  const { letters, ready: lessonsReady } = useLessons();
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<ListenRound | null>(null);
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
    if (!lessonsReady || booted.current || letters.length === 0) return;
    booted.current = true;

    const storedId = readListenTarget();
    const stored = letters.find((letter) => letter.id === storedId);
    const next = stored ? createListenRoundForTarget(letters, stored) : createListenRound(letters);
    setRound(next);

    if (!storedId) speakLetterName(next.target.letter);
  }, [lessonsReady, letters]);

  function playPrompt() {
    if (!round) return;
    speakLetterName(round.target.letter);
  }

  function handlePick(letter: LetterDoc) {
    if (!round || lock.current || phase !== "play" || tried.includes(letter.id)) return;

    if (letter.id === round.target.id) {
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

        const next = createListenRound(letters, letter.id);
        setRound(next);
        setRoundIndex((value) => value + 1);
        setPhase("play");
        setTried([]);
        setShake(null);
        lock.current = false;
        speakLetterName(next.target.letter);
      };

      advanceTimer.current = window.setTimeout(goNext, 3200);
      speakPraise(goNext);
      return;
    }

    setTried((current) => [...current, letter.id]);
    setShake((current) => ({ id: letter.id, tick: (current?.tick ?? 0) + 1 }));
    speakTryAgain();
    safePlay(playWrong);
  }

  function replay() {
    if (letters.length === 0) return;
    const next = createListenRound(letters);
    setRound(next);
    setRoundIndex(0);
    setPhase("play");
    setTried([]);
    setShake(null);
    setBurstId(0);
    lock.current = false;
    speakLetterName(next.target.letter);
  }

  const feedback =
    phase === "success"
      ? { tone: "success" as const, message: copy.correct }
      : shake
        ? { tone: "retry" as const, message: copy.wrong }
        : { tone: null, message: null };

  return (
    <main dir="ltr" className="play-bg mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6">
      <ConfettiBurst burstId={burstId} />
      <GameHeader
        title={copy.listenTitle}
        progress={phase === "done" || !round ? undefined : `${roundIndex + 1} / ${LISTEN_ROUNDS}`}
      />

      {!lessonsReady || (!round && letters.length > 0) ? (
        <p dir="ltr" className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">
          Waa la diyaarinayaa...
        </p>
      ) : letters.length === 0 ? (
        <p dir="ltr" className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">
          {copy.noLetters}
        </p>
      ) : phase === "done" ? (
        <Celebration title="Hambalyo!" body={copy.listenDone} onReplay={replay} />
      ) : !round ? (
        <p dir="ltr" className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">
          Waa la diyaarinayaa...
        </p>
      ) : (
        <>
          <section className="rounded-3xl bg-white/85 px-4 py-6 text-center shadow-xl ring-1 ring-white">
            <p dir="ltr" className="text-sm font-extrabold text-sky-800 sm:text-base">{copy.listenHint}</p>
            <motion.button
              type="button"
              onClick={playPrompt}
              aria-label="Dhageyso xarafka"
              className="pressable edge-sky relative mx-auto mt-4 flex h-40 w-40 flex-col items-center justify-center rounded-full bg-sky-500 text-white"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-2 rounded-full border-4 border-white/70"
                animate={{ scale: [1, 1.12, 1], opacity: [0.9, 0.35, 0.9] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-5xl" aria-hidden="true">😊</span>
              <Volume2 className="relative size-8" aria-hidden="true" />
            </motion.button>
            <p dir="ltr" className="mt-4 text-lg font-black text-indigo-950">Dhageyso, kadibna dooro.</p>
            {phase === "success" ? (
              <p dir="ltr" className="mt-2 text-2xl font-black text-emerald-600">{round.target.name}</p>
            ) : null}
          </section>

          <div className="grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-4 sm:gap-4">
            {round.options.map((letter) => (
              <LetterBubble
                key={letter.id}
                label={letter.letter}
                ariaLabel={letter.letter}
                bubble={bubbleForLetter(letter, letters)}
                disabled={phase !== "play" || tried.includes(letter.id)}
                dimmed={tried.includes(letter.id)}
                shaking={shake?.id === letter.id}
                shakeTick={shake?.id === letter.id ? shake.tick : 0}
                highlighted={phase === "success" && letter.id === round.target.id}
                onPress={() => handlePick(letter)}
              />
            ))}
          </div>

          <FeedbackBanner tone={feedback.tone} message={feedback.message} />
        </>
      )}
    </main>
  );
}

