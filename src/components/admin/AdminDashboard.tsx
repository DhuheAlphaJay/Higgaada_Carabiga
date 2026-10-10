"use client";

import { ChevronLeft, Pencil, RotateCcw, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useLessons } from "@/components/game/useLessons";
import { useProfiles } from "@/components/game/useStars";
import { TashkeelWord } from "@/components/game/TashkeelWord";
import { BubblyButton } from "@/components/ui/BubblyButton";
import { copy } from "@/lib/copy";
import {
  addLetter,
  addWord,
  deleteLetter,
  deleteWord,
  updateLetter,
  updateWord,
  type LetterInput,
  type WordInput,
} from "@/lib/data/lessonStore";
import { chapters, type LessonLevel } from "@/lib/data/curriculum";
import type { WordDifficulty } from "@/lib/data/lessonsData";
import { readCloudLink, subscribeCloudLink } from "@/lib/sync/cloud";
import { avatarEmoji, childLevel, deleteChild, resetChild } from "@/lib/profiles";

const fieldClass =
  "mt-1 min-h-12 w-full rounded-2xl border-2 border-indigo-100 bg-white px-3 text-base font-bold text-indigo-950 outline-none focus:border-violet-400";

const emptyWord: WordInput = {
  word: "",
  lettersText: "",
  meaning: "",
  image: "",
  difficulty: "easy",
  level: "harakat",
};

const emptyLetter: LetterInput = {
  letter: "",
  name: "",
  distractors: [],
};

export function AdminDashboard() {
  const profiles = useProfiles();
  const lessons = useLessons();
  const cloud = useSyncExternalStore(subscribeCloudLink, readCloudLink, () => "local" as const) === "cloud";

  return (
    <main dir="ltr" className="play-bg mx-auto min-h-dvh w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <Shield className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-violet-700">{copy.parent}</p>
            <h1 className="text-2xl font-black text-indigo-950 sm:text-3xl">{copy.adminTitle}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-2 text-xs font-extrabold text-indigo-900 shadow-sm">
            {cloud ? copy.storageCloud : copy.storageLocal}
          </span>
          <Link
            href="/"
            className="pressable edge-violet inline-flex min-h-12 items-center gap-1 rounded-full bg-violet-600 px-4 text-sm font-extrabold text-white"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            {copy.backHome}
          </Link>
        </div>
      </header>

      <section className="mt-6 rounded-3xl bg-white/90 p-4 shadow-xl ring-1 ring-white sm:p-6">
        <h2 className="text-xl font-black text-indigo-950 sm:text-2xl">{copy.childrenReport}</h2>
        {profiles.children.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-indigo-50 px-4 py-5 text-base font-bold text-indigo-900">{copy.noChildrenAdmin}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profiles.children.map((child) => (
              <ChildCard key={child.id} child={child} active={profiles.activeChildId === child.id} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl bg-white/90 p-4 shadow-xl ring-1 ring-white sm:p-6">
        <h2 className="text-xl font-black text-indigo-950 sm:text-2xl">{copy.lessonsCms}</h2>
        <p className="mt-2 text-sm font-bold text-indigo-800/80">{copy.liveNote}</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <WordManager words={lessons.words} />
          <LetterManager letters={lessons.letters} />
        </div>
      </section>
    </main>
  );
}

function ChildCard({
  child,
  active,
}: {
  child: { id: string; name: string; avatar: "lion" | "rocket" | "cat" | "crown"; stars: number; lessonsCompleted: number };
  active: boolean;
}) {
  const [confirm, setConfirm] = useState<"delete" | "reset" | null>(null);
  const level = childLevel(child);

  return (
    <article className={`rounded-3xl p-4 ring-1 ${active ? "bg-violet-50 ring-violet-200" : "bg-indigo-50/70 ring-indigo-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">
            {avatarEmoji(child.avatar)}
          </span>
          <div>
            <h3 className="text-lg font-black text-indigo-950">{child.name}</h3>
            <p className="text-sm font-extrabold text-violet-700">
              {copy.level}: {level}
            </p>
          </div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm font-extrabold text-indigo-950">
        <div className="rounded-2xl bg-white px-3 py-2">
          <dt className="text-xs text-indigo-700">{copy.totalStars}</dt>
          <dd className="text-xl">{child.stars}</dd>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2">
          <dt className="text-xs text-indigo-700">{copy.lessonsDone}</dt>
          <dd className="text-xl">{child.lessonsCompleted}</dd>
        </div>
      </dl>
      {confirm ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm font-extrabold text-rose-700">{copy.confirmDelete}</span>
          <button
            type="button"
            className="rounded-full bg-rose-500 px-3 py-1 text-sm font-extrabold text-white"
            onClick={() => {
              if (confirm === "delete") deleteChild(child.id);
              else resetChild(child.id);
              setConfirm(null);
            }}
          >
            {confirm === "delete" ? copy.delete : copy.resetProgress}
          </button>
          <button type="button" className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-indigo-950" onClick={() => setConfirm(null)}>
            {copy.cancelEdit}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirm("reset")}
            className="pressable inline-flex min-h-10 items-center gap-1 rounded-full bg-amber-300 px-3 text-sm font-extrabold text-indigo-950"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {copy.resetProgress}
          </button>
          <button
            type="button"
            onClick={() => setConfirm("delete")}
            className="pressable inline-flex min-h-10 items-center gap-1 rounded-full bg-rose-500 px-3 text-sm font-extrabold text-white"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {copy.delete}
          </button>
        </div>
      )}
    </article>
  );
}

function WordManager({ words }: { words: ReturnType<typeof useLessons>["words"] }) {
  const [form, setForm] = useState<WordInput>(emptyWord);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const saved = editingId ? updateWord(editingId, form) : addWord(form);
    if (!saved) {
      setError(true);
      return;
    }
    setForm(emptyWord);
    setEditingId(null);
    setError(false);
  }

  return (
    <div>
      <h3 className="text-lg font-black text-indigo-950">{copy.wordsSection}</h3>
      <form onSubmit={submit} className="mt-3 grid gap-3">
        <label className="text-sm font-extrabold text-indigo-950">
          {copy.arabicWord}
          <input
            lang="ar"
            dir="rtl"
            value={form.word}
            onChange={(event) => setForm({ ...form, word: event.target.value })}
            className={`${fieldClass} text-2xl`}
          />
        </label>
        <label className="text-sm font-extrabold text-indigo-950">
          {copy.wordLetters}
          <input
            lang="ar"
            dir="rtl"
            value={form.lettersText}
            onChange={(event) => setForm({ ...form, lettersText: event.target.value })}
            placeholder="مُ حَ مَّ د"
            className={`${fieldClass} text-xl`}
          />
        </label>
        <label className="text-sm font-extrabold text-indigo-950">
          {copy.somaliMeaning}
          <input value={form.meaning} onChange={(event) => setForm({ ...form, meaning: event.target.value })} className={fieldClass} />
        </label>
        <label className="text-sm font-extrabold text-indigo-950">
          {copy.chooseLevel}
          <select
            value={form.level}
            onChange={(event) => setForm({ ...form, level: event.target.value as LessonLevel })}
            className={fieldClass}
          >
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {copy.chapter} {chapter.order} · {chapter.arabic}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-extrabold text-indigo-950">
            {copy.emoji}
            <input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className={fieldClass} />
          </label>
          <label className="text-sm font-extrabold text-indigo-950">
            Heerka erayga
            <select
              value={form.difficulty}
              onChange={(event) => setForm({ ...form, difficulty: event.target.value as WordDifficulty })}
              className={fieldClass}
            >
              <option value="easy">{copy.easy}</option>
              <option value="medium">{copy.medium}</option>
            </select>
          </label>
        </div>
        {error ? <p className="text-sm font-extrabold text-rose-600">{copy.formWordError}</p> : null}
        <div className="flex flex-wrap gap-2">
          <BubblyButton type="submit" tone="emerald">
            {editingId ? copy.saveEdit : copy.addWord}
          </BubblyButton>
          {editingId ? (
            <BubblyButton
              type="button"
              tone="rose"
              onClick={() => {
                setEditingId(null);
                setForm(emptyWord);
                setError(false);
              }}
            >
              {copy.cancelEdit}
            </BubblyButton>
          ) : null}
        </div>
      </form>

      {words.length === 0 ? (
        <p className="mt-4 text-sm font-bold text-indigo-800">{copy.noWords}</p>
      ) : (
        <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto">
          {words.map((word) => (
            <li key={word.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50 px-3 py-3">
              <div>
                <p className="flex items-center gap-2 text-2xl font-black text-indigo-950">
                  <span aria-hidden="true">{word.image}</span>
                  <TashkeelWord letters={word.letters} focus={word.focus} className="text-indigo-950" />
                </p>
                <p className="text-sm font-bold text-indigo-800">
                  {word.meaning} · {chapters.find((chapter) => chapter.id === word.level)?.arabic}
                </p>
              </div>
              {confirmId === word.id ? (
                <ConfirmRow
                  onYes={() => {
                    deleteWord(word.id);
                    if (editingId === word.id) {
                      setEditingId(null);
                      setForm(emptyWord);
                    }
                    setConfirmId(null);
                  }}
                  onNo={() => setConfirmId(null)}
                />
              ) : (
                <RowActions
                  onEdit={() => {
                    setEditingId(word.id);
                    setForm({
                      word: word.word,
                      lettersText: word.letters.join(" "),
                      meaning: word.meaning,
                      image: word.image,
                      difficulty: word.difficulty,
                      level: word.level,
                    });
                    setError(false);
                  }}
                  onDelete={() => setConfirmId(word.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LetterManager({ letters }: { letters: ReturnType<typeof useLessons>["letters"] }) {
  const [form, setForm] = useState<LetterInput>(emptyLetter);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const choices = letters.filter((item) => item.id !== editingId);

  function toggleDistractor(id: string) {
    setForm((current) => {
      const selected = current.distractors.includes(id)
        ? current.distractors.filter((item) => item !== id)
        : current.distractors.length >= 3
          ? current.distractors
          : [...current.distractors, id];
      return { ...current, distractors: selected };
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const saved = editingId ? updateLetter(editingId, form) : addLetter(form);
    if (!saved) {
      setError(true);
      return;
    }
    setForm(emptyLetter);
    setEditingId(null);
    setError(false);
  }

  return (
    <div>
      <h3 className="text-lg font-black text-indigo-950">{copy.lettersSection}</h3>
      <form onSubmit={submit} className="mt-3 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-extrabold text-indigo-950">
            {copy.newLetter}
            <input
              lang="ar"
              dir="rtl"
              value={form.letter}
              onChange={(event) => setForm({ ...form, letter: event.target.value })}
              className={`${fieldClass} text-3xl`}
            />
          </label>
          <label className="text-sm font-extrabold text-indigo-950">
            {copy.letterName}
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-extrabold text-indigo-950">{copy.distractors}</legend>
          <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">
            {choices.map((item) => {
              const selected = form.distractors.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleDistractor(item.id)}
                  className={`min-h-10 rounded-full px-3 text-sm font-extrabold ${
                    selected ? "bg-sky-500 text-white" : "bg-sky-50 text-indigo-950"
                  }`}
                >
                  <span lang="ar" dir="rtl">
                    {item.letter}
                  </span>{" "}
                  {item.name}
                </button>
              );
            })}
          </div>
        </fieldset>
        {error ? <p className="text-sm font-extrabold text-rose-600">{copy.formLetterError}</p> : null}
        <div className="flex flex-wrap gap-2">
          <BubblyButton type="submit" tone="sky">
            {editingId ? copy.saveEdit : copy.newLetter}
          </BubblyButton>
          {editingId ? (
            <BubblyButton
              type="button"
              tone="rose"
              onClick={() => {
                setEditingId(null);
                setForm(emptyLetter);
                setError(false);
              }}
            >
              {copy.cancelEdit}
            </BubblyButton>
          ) : null}
        </div>
      </form>

      {letters.length === 0 ? (
        <p className="mt-4 text-sm font-bold text-indigo-800">{copy.noLetters}</p>
      ) : (
        <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto">
          {letters.map((letter) => (
            <li key={letter.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sky-50 px-3 py-3">
              <div>
                <p className="text-lg font-black text-indigo-950">
                  <span lang="ar" dir="rtl" className="text-3xl">
                    {letter.letter}
                  </span>{" "}
                  {letter.name}
                </p>
                <p className="text-xs font-bold text-indigo-700">
                  {letter.distractors
                    .map((id) => letters.find((item) => item.id === id)?.letter)
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
              {confirmId === letter.id ? (
                <ConfirmRow
                  onYes={() => {
                    deleteLetter(letter.id);
                    if (editingId === letter.id) {
                      setEditingId(null);
                      setForm(emptyLetter);
                    }
                    setConfirmId(null);
                  }}
                  onNo={() => setConfirmId(null)}
                />
              ) : (
                <RowActions
                  onEdit={() => {
                    setEditingId(letter.id);
                    setForm({ letter: letter.letter, name: letter.name, distractors: letter.distractors });
                    setError(false);
                  }}
                  onDelete={() => setConfirmId(letter.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="pressable inline-flex min-h-10 items-center gap-1 rounded-full bg-white px-3 text-sm font-extrabold text-indigo-950"
      >
        <Pencil className="size-4" aria-hidden="true" />
        {copy.edit}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="pressable inline-flex min-h-10 items-center gap-1 rounded-full bg-rose-500 px-3 text-sm font-extrabold text-white"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {copy.delete}
      </button>
    </div>
  );
}

function ConfirmRow({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-extrabold text-rose-700">{copy.confirmDelete}</span>
      <button type="button" onClick={onYes} className="rounded-full bg-rose-500 px-3 py-1 text-sm font-extrabold text-white">
        {copy.delete}
      </button>
      <button type="button" onClick={onNo} className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-indigo-950">
        {copy.cancelEdit}
      </button>
    </div>
  );
}
