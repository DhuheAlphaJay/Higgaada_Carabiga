"use client";

import { motion } from "framer-motion";
import { ChevronLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { copy } from "@/lib/copy";

type CelebrationProps = {
  title: string;
  body: string;
  onReplay: () => void;
};

export function Celebration({ title, body, onReplay }: CelebrationProps) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-1 flex-col items-center justify-center gap-5 rounded-3xl bg-white/85 px-5 py-10 text-center shadow-xl"
    >
      <motion.p
        aria-hidden="true"
        className="text-7xl"
        animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4 }}
      >
        🎉
      </motion.p>
      <h2 className="text-3xl font-black text-indigo-950 sm:text-4xl">{title}</h2>
      <p dir="ltr" className="max-w-md text-lg font-bold text-indigo-800">{body}</p>
      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <BubblyButton tone="emerald" onClick={onReplay} className="flex-1">
          <RotateCcw className="size-5" aria-hidden="true" />
          {copy.replay}
        </BubblyButton>
        <Link
          href="/"
          className="pressable edge-violet inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-3xl bg-violet-600 px-6 py-3 text-lg font-extrabold text-white"
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
          {copy.back}
        </Link>
      </div>
    </motion.section>
  );
}
