import type { ButtonHTMLAttributes, ReactNode } from "react";

const tones = {
  sky: "bg-sky-500 text-white edge-sky",
  amber: "bg-amber-400 text-indigo-950 edge-amber",
  emerald: "bg-emerald-500 text-white edge-emerald",
  violet: "bg-violet-600 text-white edge-violet",
  rose: "bg-rose-500 text-white edge-rose",
} as const;

type BubblyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: keyof typeof tones;
};

export function BubblyButton({
  children,
  tone = "violet",
  className = "",
  type = "button",
  ...props
}: BubblyButtonProps) {
  return (
    <button
      type={type}
      className={`pressable inline-flex min-h-14 items-center justify-center gap-2 rounded-3xl px-6 py-3 text-lg font-extrabold transition-transform disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
