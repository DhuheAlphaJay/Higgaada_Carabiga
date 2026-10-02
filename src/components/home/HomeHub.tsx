"use client";

import { motion } from "framer-motion";
import { Ear, Puzzle, Shield, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ParentGate } from "@/components/admin/ParentGate";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { useActiveChild, useStars } from "@/components/game/useStars";
import { ChildrenModal } from "@/components/profiles/ChildrenModal";
import { readLessons } from "@/lib/data/lessonStore";
import { speakArabic, speakLetterName } from "@/lib/arabicSpeech";
import { copy } from "@/lib/copy";
import { sampleOne } from "@/lib/random";
import { createListenRound } from "@/lib/rounds";
import { avatarEmoji } from "@/lib/profiles";
import { isParentUnlocked, unlockParentSession } from "@/lib/parentGate";
import { rememberListenTarget, rememberSpellWord } from "@/lib/session";

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

      <section className="relative mt-8 text-center sm:mt-14" dir="ltr">
        <p className="text-sm font-extrabold tracking-wide text-violet-700 sm:text-base">{copy.brand}</p>
        <h1 lang="ar" dir="rtl" className="mt-1 text-6xl font-black leading-none text-indigo-950 sm:text-8xl">
          {copy.appName}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg font-bold text-indigo-900 sm:text-2xl">{copy.tagline}</p>
      </section>

      <section className="relative mt-8 grid flex-1 content-start gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
        <ModeCard
          href="/listen"
          title={copy.listenTitle}
          body="Maqal magaca, kadibna dooro xarafka."
          tone="edge-sky bg-sky-500 text-white"
          icon={<Ear className="size-8" aria-hidden="true" />}
          onClick={startListen}
        />
        <ModeCard
          href="/spell"
          title={copy.spellTitle}
          body="Isku dubbarid kelmadda xaraf xaraf."
          tone="edge-amber bg-amber-400 text-indigo-950"
          icon={<Puzzle className="size-8" aria-hidden="true" />}
          onClick={startSpell}
        />
      </section>

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

function startListen() {
  const { letters } = readLessons();
  if (letters.length === 0) return;
  const round = createListenRound(letters);
  rememberListenTarget(round.target.id);
  speakLetterName(round.target.letter);
}

function startSpell() {
  const { words } = readLessons();
  if (words.length === 0) return;
  const word = sampleOne(words);
  rememberSpellWord(word.id);
  speakArabic(word.word);
}

function ModeCard({
  href,
  title,
  body,
  tone,
  icon,
  onClick,
}: {
  href: "/listen" | "/spell";
  title: string;
  body: string;
  tone: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.div whileTap={{ y: 4 }} className="h-full">
      <Link
        href={href}
        onClick={onClick}
        dir="ltr"
        className={`pressable flex h-full min-h-44 flex-col justify-between rounded-3xl p-5 text-left sm:min-h-56 sm:p-7 ${tone}`}
      >
        <span className="inline-flex size-16 items-center justify-center rounded-3xl bg-white/25">{icon}</span>
        <span className="mt-6 block">
          <span className="block text-2xl font-black leading-tight sm:text-3xl">{title}</span>
          <span className="mt-2 block text-base font-bold leading-snug opacity-90 sm:text-lg">{body}</span>
        </span>
      </Link>
    </motion.div>
  );
}
