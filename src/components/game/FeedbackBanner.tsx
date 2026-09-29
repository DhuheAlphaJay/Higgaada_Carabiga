"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, PartyPopper } from "lucide-react";

type FeedbackBannerProps = {
  tone: "success" | "retry" | null;
  message: string | null;
};

export function FeedbackBanner({ tone, message }: FeedbackBannerProps) {
  return (
    <div className="min-h-[4.75rem]">
      <AnimatePresence mode="wait">
        {tone && message ? (
          <motion.div
            key={`${tone}-${message}`}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={
              tone === "retry"
                ? { opacity: 1, y: 0, scale: 1, x: [0, -8, 8, -5, 5, 0] }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={{ opacity: 0, y: -8 }}
            dir="ltr"
            className={`flex items-center gap-3 rounded-3xl px-4 py-4 text-base font-extrabold shadow-lg sm:text-lg ${
              tone === "success"
                ? "bg-emerald-500 text-white"
                : "bg-amber-300 text-indigo-950 ring-4 ring-rose-400"
            }`}
          >
            {tone === "success" ? (
              <PartyPopper className="size-7 shrink-0" aria-hidden="true" />
            ) : (
              <Heart className="size-7 shrink-0" aria-hidden="true" />
            )}
            <p>{message}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
