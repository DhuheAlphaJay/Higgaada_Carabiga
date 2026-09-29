"use client";

import Link from "next/link";
import { ChevronLeft, Star } from "lucide-react";
import { useActiveChild, useStars } from "@/components/game/useStars";
import { copy } from "@/lib/copy";
import { avatarEmoji } from "@/lib/profiles";

type GameHeaderProps = {
  title: string;
  progress?: string;
};

export function GameHeader({ title, progress }: GameHeaderProps) {
  const stars = useStars();
  const child = useActiveChild();

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="pressable edge-violet inline-flex min-h-16 flex-1 items-center justify-center gap-2 rounded-3xl bg-violet-600 px-4 text-lg font-black text-white sm:flex-none sm:px-6"
        >
          <ChevronLeft className="size-7" aria-hidden="true" />
          {copy.back}
        </Link>
        <div
          className="inline-flex min-h-16 shrink-0 items-center gap-1 rounded-3xl bg-amber-300 px-4 text-xl font-black text-indigo-950 shadow-[0_5px_0_0_#d97706]"
          aria-label={`${copy.stars}: ${stars}`}
        >
          <Star className="size-6 fill-indigo-950" aria-hidden="true" />
          {child ? <span aria-hidden="true">{avatarEmoji(child.avatar)}</span> : null}
          <span>{stars}</span>
        </div>
      </div>
      <div className="text-center" dir="ltr">
        <h1 className="text-xl font-black text-indigo-950 sm:text-2xl">{title}</h1>
        {progress ? <p className="text-sm font-bold text-indigo-700">{progress}</p> : null}
      </div>
    </header>
  );
}
