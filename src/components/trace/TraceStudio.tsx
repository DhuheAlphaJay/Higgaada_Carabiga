"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { GameHeader } from "@/components/game/GameHeader";
import { TracingCanvas } from "@/components/TracingCanvas";
import { useLessons } from "@/components/game/useLessons";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { speakLetterName, speakVocalized, speakWritingPraise } from "@/lib/arabicSpeech";
import { copy } from "@/lib/copy";
import { addStars } from "@/lib/profiles";

type TraceMode = "letter" | "word";

export function TraceStudio() {
  const { letters, words, ready } = useLessons();
  const [mode, setMode] = useState<TraceMode>("letter");
  const [index, setIndex] = useState(0);
  const [burstId, setBurstId] = useState(0);
  const letter = letters[letters.length === 0 ? 0 : index % letters.length];
  const word = words[words.length === 0 ? 0 : index % words.length];
  const items = mode === "letter" ? letters : words;
  const safeIndex = items.length === 0 ? 0 : index % items.length;
  const guide = mode === "letter" ? (letter ? tracingGlyph(letter.letter) : "") : word ? word.word : "";
  const caption = mode === "letter" ? (letter?.name ?? "") : (word?.meaning ?? "");

  function switchMode(next: TraceMode) {
    setMode(next);
    setIndex(0);
  }

  function step(direction: -1 | 1) {
    if (items.length === 0) return;
    setIndex((value) => (value + direction + items.length) % items.length);
  }

  function listen() {
    if (mode === "letter" && letter) speakLetterName(letter.letter);
    if (mode === "word" && word) speakVocalized(word.letters, word.word);
  }

  function finish() {
    setBurstId((value) => value + 1);
    addStars(1);
    speakWritingPraise();
  }

  return (
    <main dir="ltr" className="play-bg mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
      <ConfettiBurst burstId={burstId} />
      <GameHeader title={copy.traceTitle} progress={items.length > 0 ? `${safeIndex + 1} / ${items.length}` : undefined} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => switchMode("letter")}
          className={`pressable min-h-16 rounded-3xl px-3 text-lg font-black ${
            mode === "letter" ? "edge-violet bg-violet-600 text-white" : "bg-white text-indigo-950 ring-2 ring-violet-100"
          }`}
        >
          {copy.traceLetters}
        </button>
        <button
          type="button"
          onClick={() => switchMode("word")}
          className={`pressable min-h-16 rounded-3xl px-3 text-lg font-black ${
            mode === "word" ? "edge-amber bg-amber-400 text-indigo-950" : "bg-white text-indigo-950 ring-2 ring-amber-100"
          }`}
        >
          {copy.traceWords}
        </button>
      </div>

      <p className="text-center text-base font-extrabold text-indigo-800">
        {mode === "letter" ? copy.traceLetterBlurb : copy.traceWordBlurb}
      </p>

      {!ready ? (
        <p className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">Waa la diyaarinayaa...</p>
      ) : items.length === 0 ? (
        <p className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">
          {mode === "letter" ? copy.noLetters : copy.noWords}
        </p>
      ) : (
        <>
          <p className="text-center text-sm font-extrabold text-violet-700">{copy.traceHint}</p>
          <TracingCanvas key={guide} guide={guide} onListen={listen} onDone={finish} />
          <p className="text-center text-2xl font-black text-indigo-950">{caption}</p>
          <div className="grid grid-cols-2 gap-3">
            <BubblyButton tone="violet" onClick={() => step(-1)}>
              <ChevronLeft className="size-6" aria-hidden="true" />
              {copy.tracePrevious}
            </BubblyButton>
            <BubblyButton tone="sky" onClick={() => step(1)}>
              {copy.next}
              <ChevronRight className="size-6" aria-hidden="true" />
            </BubblyButton>
          </div>
        </>
      )}
    </main>
  );
}

function tracingGlyph(letter: string) {
  if (letter === "ا") return "أ";
  return letter;
}
