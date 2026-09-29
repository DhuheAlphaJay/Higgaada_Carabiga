"use client";

import { Shield } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { copy } from "@/lib/copy";
import { expectedParentPin } from "@/lib/firebase";

type ParentGateProps = {
  onUnlock: () => void;
  onCancel?: () => void;
};

function makeProblem() {
  const left = 4 + Math.floor(Math.random() * 9);
  const right = 4 + Math.floor(Math.random() * 9);
  return { left, right, answer: left + right };
}

export function ParentGate({ onUnlock, onCancel }: ParentGateProps) {
  const [problem] = useState(makeProblem);
  const [math, setMath] = useState("");
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const mathOk = math.trim() !== "" && Number(math.trim()) === problem.answer;
    const pinOk = pin.trim() !== "" && pin.trim() === expectedParentPin();
    if (!mathOk && !pinOk) {
      setWrong(true);
      return;
    }
    setWrong(false);
    onUnlock();
  }

  return (
    <form onSubmit={submit} dir="ltr" className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-violet-100 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <Shield className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-extrabold text-violet-700">{copy.parent}</p>
          <h2 className="text-2xl font-black text-indigo-950">{copy.parentGate}</h2>
        </div>
      </div>
      <p className="mt-4 text-sm font-bold text-indigo-800/80">{copy.parentHint}</p>

      <label className="mt-5 block text-sm font-extrabold text-indigo-950">
        {copy.parentMath}: {problem.left} + {problem.right} = ?
        <input
          value={math}
          onChange={(event) => {
            setMath(event.target.value);
            setWrong(false);
          }}
          inputMode="numeric"
          autoComplete="off"
          className="mt-2 min-h-12 w-full rounded-2xl border-2 border-indigo-100 px-3 text-lg font-black text-indigo-950 outline-none focus:border-violet-400"
        />
      </label>

      <label className="mt-4 block text-sm font-extrabold text-indigo-950">
        {copy.parentPin}
        <input
          value={pin}
          onChange={(event) => {
            setPin(event.target.value);
            setWrong(false);
          }}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          className="mt-2 min-h-12 w-full rounded-2xl border-2 border-indigo-100 px-3 text-lg font-black tracking-widest text-indigo-950 outline-none focus:border-violet-400"
        />
      </label>

      {wrong ? <p className="mt-3 text-sm font-extrabold text-rose-600">{copy.parentWrong}</p> : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <BubblyButton type="submit" tone="violet" className="w-full">
          {copy.parentEnter}
        </BubblyButton>
        {onCancel ? (
          <BubblyButton type="button" tone="rose" className="w-full" onClick={onCancel}>
            {copy.close}
          </BubblyButton>
        ) : null}
      </div>
    </form>
  );
}
