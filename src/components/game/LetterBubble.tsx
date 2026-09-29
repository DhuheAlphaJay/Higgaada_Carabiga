"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, type CSSProperties } from "react";
import type { BubbleStyle } from "@/types/content";

type LetterBubbleProps = {
  label: string;
  ariaLabel: string;
  bubble: BubbleStyle;
  disabled?: boolean;
  shaking?: boolean;
  shakeTick?: number;
  highlighted?: boolean;
  dimmed?: boolean;
  enableDrag?: boolean;
  onPress: () => void;
  onDragRelease?: (point: { x: number; y: number }) => void;
};

function clientPoint(event: MouseEvent | TouchEvent | PointerEvent) {
  if ("changedTouches" in event && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }

  if ("clientX" in event) {
    return { x: event.clientX, y: event.clientY };
  }

  return null;
}

export function LetterBubble({
  label,
  ariaLabel,
  bubble,
  disabled = false,
  shaking = false,
  shakeTick = 0,
  highlighted = false,
  dimmed = false,
  enableDrag = false,
  onPress,
  onDragRelease,
}: LetterBubbleProps) {
  const controls = useAnimationControls();
  const dragged = useRef(false);

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
      aria-label={ariaLabel}
      disabled={disabled}
      drag={enableDrag && !disabled}
      dragSnapToOrigin
      dragElastic={0.35}
      dragMomentum={false}
      animate={controls}
      whileTap={disabled ? undefined : { y: 4, scale: 0.98 }}
      whileDrag={{ scale: 1.08, zIndex: 20 }}
      onDragStart={() => {
        dragged.current = false;
      }}
      onDrag={(_, info) => {
        if (Math.hypot(info.offset.x, info.offset.y) > 14) {
          dragged.current = true;
        }
      }}
      onDragEnd={(event) => {
        if (!dragged.current) return;
        const point = clientPoint(event);
        if (point && onDragRelease) onDragRelease(point);
      }}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onPress();
      }}
      style={
        {
          "--bubble": bubble.background,
          "--edge": bubble.edge,
          "--bubble-ink": bubble.text === "light" ? "#ffffff" : "#1e1b4b",
          touchAction: enableDrag ? "none" : "manipulation",
        } as CSSProperties
      }
      className={`bubble relative flex h-20 w-20 items-center justify-center rounded-3xl text-4xl font-black leading-none sm:h-24 sm:w-24 sm:text-5xl md:h-28 md:w-28 ${
        highlighted ? "ring-4 ring-amber-200 ring-offset-2 ring-offset-orange-50" : ""
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <span lang="ar" dir="rtl">
        {label}
      </span>
    </motion.button>
  );
}
