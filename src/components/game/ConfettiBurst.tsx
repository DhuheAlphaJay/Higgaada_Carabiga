"use client";

import { useEffect } from "react";

const colors = ["#f472b6", "#38bdf8", "#fbbf24", "#34d399", "#a78bfa", "#fb923c"];

export function ConfettiBurst({ burstId }: { burstId: number }) {
  useEffect(() => {
    if (burstId === 0) return;

    let cancelled = false;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;

      void confetti({
        particleCount: 90,
        spread: 72,
        startVelocity: 38,
        origin: { y: 0.62 },
        colors,
      });
      void confetti({
        particleCount: 46,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      void confetti({
        particleCount: 46,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [burstId]);

  return null;
}
