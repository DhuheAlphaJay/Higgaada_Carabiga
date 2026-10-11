"use client";

import { motion } from "framer-motion";
import { Pencil, Shield, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ParentGate } from "@/components/admin/ParentGate";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { TashkeelWord } from "@/components/game/TashkeelWord";
import { useLessons } from "@/components/game/useLessons";
import { useActiveChild, useStars } from "@/components/game/useStars";
import { ChildrenModal } from "@/components/profiles/ChildrenModal";
import { chapters } from "@/lib/data/curriculum";
import { readLessons } from "@/lib/data/lessonStore";
import { speakLetterName } from "@/lib/arabicSpeech";
import { copy } from "@/lib/copy";
import { bubbleForLetter, createListenRound } from "@/lib/rounds";
import { avatarEmoji } from "@/lib/profiles";
import { isParentUnlocked, unlockParentSession } from "@/lib/parentGate";
import { rememberListenTarget } from "@/lib/session";

const floaters = [
  { glyph: "ا", className: "start-[6%] top-16 text-sky-400" },
  { glyph: "ب", className: "end-[8%] top-24 text-rose-400" },
  { glyph: "ج", className: "start-[12%] bottom-24 text-amber-400" },
  { glyph: "م", className: "end-[14%] bottom-16 text-emerald-400" },
  { glyph: "س", className: "start-[42%] top-10 hidden text-violet-400 sm:block" },
];

export function HomeHub() {
  const stars = useStars();
  const child = useActiveChild();
  const router = useRouter();
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const lessons = useLessons();
  const [hub, setHub] = useState<"letters" | "words">("letters");

  function openParent() {
    if (isParentUnlocked()) {
      router.push("/admin");
      return;
    }
    setGateOpen(true);
  }

  return (
    <main className="play-bg relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {floaters.map((item, index) => (
          <motion.span
            key={item.glyph}
            lang="ar"
            dir="rtl"
            className={`absolute text-6xl font-black opacity-70 sm:text-7xl ${item.className}`}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3.2 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
          >
            {item.glyph}
          </motion.span>
        ))}
      </div>

      <header className="relative flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            dir="ltr"
            onClick={() => setProfilesOpen(true)}
            className="pressable edge-soft inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-4 text-sm font-extrabold text-indigo-950"
          >
            <span aria-hidden="true">{child ? avatarEmoji(child.avatar) : "🧒"}</span>
            {copy.audience}
          </button>
          <button
            type="button"
            dir="ltr"
            onClick={openParent}
            aria-label={copy.parent}
            className="pressable edge-violet inline-flex min-h-12 items-center gap-2 rounded-full bg-violet-600 px-3 text-sm font-extrabold text-white"
          >
            <Shield className="size-5" aria-hidden="true" />
            <span>{copy.parent}</span>
          </button>
        </div>
        <div
          className="inline-flex min-h-12 items-center gap-1 rounded-3xl bg-amber-300 px-4 text-lg font-black text-indigo-950 shadow-[0_5px_0_0_#d97706]"
          aria-label={`${copy.stars}: ${stars}`}
        >
          <Star className="size-5 fill-indigo-950" aria-hidden="true" />
          <span>{stars}</span>
        </div>
      </header>

      <InstallAppButton />

      <section className="relative mt-6 text-center" dir="ltr">
        <p className="text-sm font-extrabold tracking-wide text-violet-700 sm:text-base">{copy.brand}</p>
        <h1 lang="ar" dir="rtl" className="mt-1 text-5xl font-black leading-none text-indigo-950 sm:text-7xl">
          {copy.appName}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg font-bold text-indigo-900 sm:text-2xl">{copy.pathTitle}</p>
      </section>

      <div className="relative mt-6 grid grid-cols-2 gap-3" role="tablist" aria-label={copy.pathTitle}>
        <button
          type="button"
          role="tab"
          aria-selected={hub === "letters"}
          onClick={() => setHub("letters")}
          className={`pressable min-h-20 rounded-3xl px-3 text-base font-black leading-tight sm:min-h-24 sm:text-lg ${
            hub === "letters" ? "edge-sky bg-sky-500 text-white" : "bg-white text-indigo-950 ring-2 ring-sky-100"
          }`}
        >
          🔤 {copy.lettersHub}
          <span className="mt-1 block text-sm font-extrabold opacity-90">{copy.lettersHubCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={hub === "words"}
          onClick={() => setHub("words")}
          className={`pressable min-h-20 rounded-3xl px-3 text-base font-black leading-tight sm:min-h-24 sm:text-lg ${
            hub === "words" ? "edge-amber bg-amber-400 text-indigo-950" : "bg-white text-indigo-950 ring-2 ring-amber-100"
          }`}
        >
          📚 {copy.wordsHub}
          <span className="mt-1 block text-sm font-extrabold opacity-90">{copy.wordsHubCount}</span>
        </button>
      </div>

      {hub === "letters" ? (
        <section className="relative mt-4 flex flex-1 flex-col gap-4">
          <Link
            href="/listen"
            onClick={startListen}
            className="pressable edge-violet flex min-h-24 items-center gap-4 rounded-[2rem] bg-violet-600 px-5 py-4 text-white"
          >
            <span className="text-4xl" aria-hidden="true">
              🎮
            </span>
            <span className="text-lg font-black leading-snug sm:text-2xl">{copy.letterGame}</span>
          </Link>
          {lessons.letters.length === 0 ? (
            <p className="rounded-3xl bg-white/85 px-4 py-6 text-center text-xl font-black text-indigo-950">{copy.noLetters}</p>
          ) : null}
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
            {lessons.letters.map((letter) => {
              const bubble = bubbleForLetter(letter, lessons.letters);
              const ink = bubble.text === "light" ? "#fff" : "#1e1b4b";
              return (
                <li
                  key={letter.id}
                  className="flex flex-col overflow-hidden rounded-3xl"
                  style={{ backgroundColor: bubble.background, boxShadow: `0 6px 0 0 ${bubble.edge}` }}
                >
                  <button
                    type="button"
                    onClick={() => speakLetterName(letter.letter)}
                    className="pressable flex min-h-20 flex-col items-center justify-center px-1 py-2"
                    style={{ color: ink }}
                  >
                    <span lang="ar" dir="rtl" className="text-4xl font-black leading-none sm:text-5xl">
                      {shownLetter(letter.letter)}
                    </span>
                    <span className="mt-1 text-[10px] font-extrabold sm:text-xs">{letter.name}</span>
                  </button>
                  <Link
                    href={`/trace?letter=${letter.id}`}
                    aria-label={`${copy.traceThisLetter} ${letter.name}`}
                    className="pressable flex min-h-11 items-center justify-center bg-white/95 text-xl"
                  >
                    <span aria-hidden="true">✏️</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="relative mt-4 grid flex-1 content-start gap-3 sm:grid-cols-2">
          {chapters.map((chapter) => {
            const sample = lessons.words.find((word) => word.level === chapter.id);
            return (
              <motion.div key={chapter.id} whileTap={{ y: 4 }} className="h-full">
                <Link
                  href={`/learn/${chapter.id}`}
                  dir="ltr"
                  className={`pressable flex h-full min-h-40 flex-col justify-between rounded-3xl p-4 text-left sm:p-5 ${chapter.tone}`}
                >
                  <span className="text-sm font-black">
                    {copy.chapter} {chapter.order}
                  </span>
                  <span lang="ar" dir="rtl" className="mt-2 block text-2xl font-black leading-tight sm:text-3xl">
                    {chapter.arabic}
                  </span>
                  <span className="mt-1 block text-sm font-bold leading-snug opacity-90">{chapter.somali}</span>
                  <span className="mt-3 inline-flex w-fit rounded-2xl bg-white px-3 py-1">
                    {sample ? (
                      <TashkeelWord letters={sample.letters} focus={sample.focus} className="text-3xl font-black text-indigo-950" />
                    ) : (
                      <span lang="ar" dir="rtl" className="text-2xl font-black text-rose-600">
                        {chapter.marks}
                      </span>
                    )}
                  </span>
                </Link>
              </motion.div>
            );
          })}
          <Link
            href="/trace"
            className="pressable edge-violet flex min-h-32 items-center gap-4 rounded-[2rem] bg-violet-600 px-5 py-5 text-white sm:col-span-2 sm:min-h-36 sm:px-7"
          >
            <span className="text-5xl" aria-hidden="true">
              ✏️
            </span>
            <span>
              <span className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
                <Pencil className="size-7" aria-hidden="true" />
                {copy.traceTitle}
              </span>
              <span className="mt-1 block text-base font-bold opacity-90">{copy.traceWordBlurb}</span>
            </span>
          </Link>
        </section>
      )}

      <p dir="ltr" className="relative mt-6 text-center text-sm font-bold text-indigo-800/80">
        Taleefan, tablet, iyo laptop.
      </p>
      <ChildrenModal open={profilesOpen} onClose={() => setProfilesOpen(false)} />
      {gateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/50 px-4 py-8">
          <ParentGate
            onUnlock={() => {
              unlockParentSession();
              setGateOpen(false);
              router.push("/admin");
            }}
            onCancel={() => setGateOpen(false)}
          />
        </div>
      ) : null}
    </main>
  );
}

function shownLetter(letter: string) {
  return letter === "ا" ? "أ" : letter;
}

function startListen() {
  const { letters } = readLessons();
  if (letters.length === 0) return;
  const round = createListenRound(letters);
  rememberListenTarget(round.target.id);
  speakLetterName(round.target.letter);
}
