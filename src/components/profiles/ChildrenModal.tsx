"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useProfiles } from "@/components/game/useStars";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { copy } from "@/lib/copy";
import { addChild, avatarEmoji, avatars, setActiveChild, type AvatarId } from "@/lib/profiles";

type ChildrenModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ChildrenModal({ open, onClose }: ChildrenModalProps) {
  const profiles = useProfiles();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("lion");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const child = addChild(name, avatar);
    if (!child) return;
    setName("");
    setAvatar("lion");
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-indigo-950/50 p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="children-title"
            dir="ltr"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-orange-50 p-4 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="children-title" className="text-2xl font-black text-indigo-950">
                {copy.profilesTitle}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="pressable edge-soft inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-white text-indigo-950"
                aria-label={copy.close}
              >
                <X className="size-6" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="mt-4 rounded-3xl bg-white p-4 shadow">
              <label className="block text-sm font-extrabold text-indigo-800" htmlFor="child-name">
                {copy.childName}
              </label>
              <input
                id="child-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={24}
                dir="ltr"
                className="mt-2 min-h-14 w-full rounded-2xl border-4 border-amber-200 bg-amber-50 px-4 text-lg font-bold text-indigo-950 outline-none focus:border-violet-400"
                placeholder="Tusaale: Aamina"
              />
              <p className="mt-4 text-sm font-extrabold text-indigo-800">{copy.chooseAvatar}</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {avatars.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAvatar(item.id)}
                    aria-pressed={avatar === item.id}
                    className={`min-h-20 rounded-2xl text-3xl ${
                      avatar === item.id ? "bg-violet-600 text-white shadow-[0_5px_0_0_#5b21b6]" : "bg-orange-100"
                    }`}
                  >
                    <span className="block">{item.emoji}</span>
                    <span className="block text-xs font-extrabold">{item.label}</span>
                  </button>
                ))}
              </div>
              <BubblyButton type="submit" tone="emerald" className="mt-4 w-full" disabled={!name.trim()}>
                {copy.addChild}
              </BubblyButton>
            </form>

            <div className="mt-4 flex flex-col gap-3">
              {profiles.children.length === 0 ? (
                <p className="rounded-3xl bg-white px-4 py-5 text-center text-base font-bold text-indigo-800">
                  {copy.noChildren}
                </p>
              ) : (
                profiles.children.map((child) => {
                  const active = child.id === profiles.activeChildId;
                  return (
                    <article
                      key={child.id}
                      className={`rounded-3xl p-4 shadow ${active ? "bg-amber-200 ring-4 ring-violet-500" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-16 items-center justify-center rounded-2xl bg-orange-100 text-4xl">
                          {avatarEmoji(child.avatar)}
                        </span>
                        <div>
                          <h3 className="text-xl font-black text-indigo-950">{child.name}</h3>
                          <p className="text-sm font-bold text-indigo-800">
                            {copy.stars}: {child.stars} · {copy.lessons}: {child.lessonsCompleted}
                          </p>
                        </div>
                      </div>
                      <BubblyButton
                        tone={active ? "amber" : "violet"}
                        className="mt-3 w-full"
                        disabled={active}
                        onClick={() => setActiveChild(child.id)}
                      >
                        {active ? copy.playingNow : copy.switchChild}
                      </BubblyButton>
                    </article>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
