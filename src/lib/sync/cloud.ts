import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import type { LetterDoc, WordDoc } from "@/lib/data/lessonsData";
import type { ChildProfile, ProfileState } from "@/lib/profiles";

let started = false;
let lessonsRevision = 0;
let lessonsAck = 0;
let profilesRevision = 0;
let profilesAck = 0;
let lessonPushing = false;
let lessonPushAgain = false;
let profilePushing = false;
let profilePushAgain = false;

const LINK_EVENT = "xuruuf-cloud-link";
let cloudLink: "local" | "cloud" = "local";

export function readCloudLink() {
  return cloudLink;
}

export function subscribeCloudLink(onStoreChange: () => void) {
  window.addEventListener(LINK_EVENT, onStoreChange);
  return () => window.removeEventListener(LINK_EVENT, onStoreChange);
}

function markCloudConnected() {
  if (cloudLink === "cloud") return;
  cloudLink = "cloud";
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LINK_EVENT));
}

export function markLessonsDirty() {
  lessonsRevision += 1;
}

export function markProfilesDirty() {
  profilesRevision += 1;
}

export async function startCloudSync() {
  if (started || typeof window === "undefined" || !isFirebaseConfigured()) return;
  started = true;

  try {
    const db = await getDb();
    if (!db) {
      started = false;
      return;
    }
    const firestore = await import("firebase/firestore");
    await reconcileLessons(db, firestore);
    await reconcileProfiles(db, firestore);
    watchLessons(db, firestore);
    watchProfiles(db, firestore);
    markCloudConnected();
  } catch {
    started = false;
  }
}

export async function pushLessons() {
  if (!isFirebaseConfigured()) return;
  if (lessonPushing) {
    lessonPushAgain = true;
    return;
  }

  lessonPushing = true;
  try {
    do {
      lessonPushAgain = false;
      const revision = lessonsRevision;
      const { readLessons } = await import("@/lib/data/lessonStore");
      const state = readLessons();
      const db = await getDb();
      if (!db) return;
      const firestore = await import("firebase/firestore");
      await writeLessons(db, firestore, state.letters, state.words);
      if (lessonsRevision === revision) lessonsAck = revision;
    } while (lessonPushAgain);
  } catch {
    lessonPushAgain = false;
  } finally {
    lessonPushing = false;
  }
}

export async function pushProfiles() {
  if (!isFirebaseConfigured()) return;
  if (profilePushing) {
    profilePushAgain = true;
    return;
  }

  profilePushing = true;
  try {
    do {
      profilePushAgain = false;
      const revision = profilesRevision;
      const { readProfiles } = await import("@/lib/profiles");
      const state = readProfiles();
      const db = await getDb();
      if (!db) return;
      const firestore = await import("firebase/firestore");
      await writeProfiles(db, firestore, state);
      if (profilesRevision === revision) profilesAck = revision;
    } while (profilePushAgain);
  } catch {
    profilePushAgain = false;
  } finally {
    profilePushing = false;
  }
}

type FirestoreApi = typeof import("firebase/firestore");

async function reconcileLessons(db: import("firebase/firestore").Firestore, firestore: FirestoreApi) {
  const [letterSnap, wordSnap] = await Promise.all([
    firestore.getDocs(firestore.collection(db, "letters")),
    firestore.getDocs(firestore.collection(db, "words")),
  ]);

  if (letterSnap.empty && wordSnap.empty) {
    const { readLessons } = await import("@/lib/data/lessonStore");
    const revision = lessonsRevision;
    const state = readLessons();
    await writeLessons(db, firestore, state.letters, state.words);
    if (lessonsRevision === revision) lessonsAck = revision;
    else await pushLessons();
    return;
  }

  const letters = letterSnap.docs.flatMap((item) => {
    const letter = letterFromData(item.id, item.data());
    return letter ? [letter] : [];
  });
  const words = wordSnap.docs.flatMap((item) => {
    const word = wordFromData(item.id, item.data());
    return word ? [word] : [];
  });
  const { readLessons, replaceLessons } = await import("@/lib/data/lessonStore");
  const current = readLessons();
  if (sameLetters(current.letters, letters) && sameWords(current.words, words)) return;
  replaceLessons({ letters, words });
}

async function reconcileProfiles(db: import("firebase/firestore").Firestore, firestore: FirestoreApi) {
  const [childSnap, settingsSnap] = await Promise.all([
    firestore.getDocs(firestore.collection(db, "children")),
    firestore.getDoc(firestore.doc(db, "settings", "classroom")),
  ]);

  if (childSnap.empty && !settingsSnap.exists()) {
    const { readProfiles } = await import("@/lib/profiles");
    const revision = profilesRevision;
    await writeProfiles(db, firestore, readProfiles());
    if (profilesRevision === revision) profilesAck = revision;
    else await pushProfiles();
    return;
  }

  const next = profilesFromCloud(childSnap.docs, settingsSnap.exists() ? settingsSnap.data() : {});
  const { readProfiles, replaceProfiles } = await import("@/lib/profiles");
  if (sameProfiles(readProfiles(), next)) return;
  replaceProfiles(next);
}

function watchLessons(db: import("firebase/firestore").Firestore, firestore: FirestoreApi) {
  const apply = async () => {
    if (lessonsRevision !== lessonsAck) return;
    const [letterSnap, wordSnap] = await Promise.all([
      firestore.getDocs(firestore.collection(db, "letters")),
      firestore.getDocs(firestore.collection(db, "words")),
    ]);
    const letters = letterSnap.docs.flatMap((item) => {
      const letter = letterFromData(item.id, item.data());
      return letter ? [letter] : [];
    });
    const words = wordSnap.docs.flatMap((item) => {
      const word = wordFromData(item.id, item.data());
      return word ? [word] : [];
    });
    const { readLessons, replaceLessons } = await import("@/lib/data/lessonStore");
    const current = readLessons();
    if (sameLetters(current.letters, letters) && sameWords(current.words, words)) return;
    if (lessonsRevision !== lessonsAck) return;
    replaceLessons({ letters, words });
  };

  firestore.onSnapshot(firestore.collection(db, "letters"), () => {
    void apply();
  });
  firestore.onSnapshot(firestore.collection(db, "words"), () => {
    void apply();
  });
}

function watchProfiles(db: import("firebase/firestore").Firestore, firestore: FirestoreApi) {
  let childrenDocs: Array<{ id: string; data: () => Record<string, unknown> }> = [];
  let settings: Record<string, unknown> = {};
  let sawChildren = false;
  let sawSettings = false;

  const apply = async () => {
    if (!sawChildren || !sawSettings || profilesRevision !== profilesAck) return;
    const next = profilesFromCloud(childrenDocs, settings);
    const { readProfiles, replaceProfiles } = await import("@/lib/profiles");
    if (sameProfiles(readProfiles(), next)) return;
    if (profilesRevision !== profilesAck) return;
    replaceProfiles(next);
  };

  firestore.onSnapshot(firestore.collection(db, "children"), (snap) => {
    childrenDocs = snap.docs;
    sawChildren = true;
    void apply();
  });
  firestore.onSnapshot(firestore.doc(db, "settings", "classroom"), (snap) => {
    settings = snap.exists() ? snap.data() : {};
    sawSettings = true;
    void apply();
  });
}

async function writeLessons(
  db: import("firebase/firestore").Firestore,
  firestore: FirestoreApi,
  letters: LetterDoc[],
  words: WordDoc[],
) {
  await replaceDocs(
    db,
    firestore,
    "letters",
    letters.map((item) => ({
      id: item.id,
      data: { letter: item.letter, name: item.name, audio: item.audio, distractors: item.distractors },
    })),
  );
  await replaceDocs(
    db,
    firestore,
    "words",
    words.map((item) => ({
      id: item.id,
      data: {
        word: item.word,
        meaning: item.meaning,
        letters: item.letters,
        image: item.image,
        difficulty: item.difficulty,
      },
    })),
  );
}

async function writeProfiles(
  db: import("firebase/firestore").Firestore,
  firestore: FirestoreApi,
  state: ProfileState,
) {
  await replaceDocs(
    db,
    firestore,
    "children",
    state.children.map((child) => ({
      id: child.id,
      data: {
        name: child.name,
        avatar: child.avatar,
        stars: child.stars,
        lessonsCompleted: child.lessonsCompleted,
      },
    })),
  );
  await firestore.setDoc(firestore.doc(db, "settings", "classroom"), {
    activeChildId: state.activeChildId,
    unassignedStars: state.unassignedStars,
    unassignedLessons: state.unassignedLessons,
  });
}

async function replaceDocs(
  db: import("firebase/firestore").Firestore,
  firestore: FirestoreApi,
  name: string,
  rows: Array<{ id: string; data: Record<string, unknown> }>,
) {
  const snap = await firestore.getDocs(firestore.collection(db, name));
  const batch = firestore.writeBatch(db);
  const ids = new Set(rows.map((row) => row.id));
  let writes = 0;
  snap.docs.forEach((item) => {
    if (ids.has(item.id)) return;
    batch.delete(item.ref);
    writes += 1;
  });
  rows.forEach((row) => {
    batch.set(firestore.doc(db, name, row.id), row.data);
    writes += 1;
  });
  if (writes === 0) return;
  await batch.commit();
}

function letterFromData(id: string, data: Record<string, unknown>): LetterDoc | null {
  if (typeof data.letter !== "string" || typeof data.name !== "string") return null;
  const distractors = Array.isArray(data.distractors)
    ? data.distractors.filter((item): item is string => typeof item === "string").slice(0, 3)
    : [];
  return {
    id,
    letter: data.letter,
    name: data.name,
    audio: typeof data.audio === "string" ? data.audio : id,
    distractors,
  };
}

function wordFromData(id: string, data: Record<string, unknown>): WordDoc | null {
  if (typeof data.word !== "string" || typeof data.meaning !== "string" || !Array.isArray(data.letters)) return null;
  const letters = data.letters.filter((item): item is string => typeof item === "string");
  if (letters.length === 0) return null;
  return {
    id,
    word: data.word,
    meaning: data.meaning,
    letters,
    image: typeof data.image === "string" && data.image.trim() ? data.image : "⭐",
    difficulty: data.difficulty === "medium" ? "medium" : "easy",
  };
}

function profilesFromCloud(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>,
  settings: Record<string, unknown>,
): ProfileState {
  const children = docs.flatMap((item) => {
    const data = item.data();
    const avatar = data.avatar;
    if (typeof data.name !== "string") return [];
    if (avatar !== "lion" && avatar !== "rocket" && avatar !== "cat" && avatar !== "crown") return [];
    return [
      {
        id: item.id,
        name: data.name,
        avatar,
        stars: numberField(data.stars),
        lessonsCompleted: numberField(data.lessonsCompleted),
      } satisfies ChildProfile,
    ];
  });
  const activeChildId =
    typeof settings.activeChildId === "string" && children.some((child) => child.id === settings.activeChildId)
      ? settings.activeChildId
      : (children[0]?.id ?? null);

  return {
    activeChildId,
    children,
    unassignedStars: numberField(settings.unassignedStars),
    unassignedLessons: numberField(settings.unassignedLessons),
  };
}

function numberField(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function sameLetters(left: LetterDoc[], right: LetterDoc[]) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function sameWords(left: WordDoc[], right: WordDoc[]) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function sameProfiles(left: ProfileState, right: ProfileState) {
  return (
    left.activeChildId === right.activeChildId &&
    left.unassignedStars === right.unassignedStars &&
    left.unassignedLessons === right.unassignedLessons &&
    JSON.stringify(sorted(left.children)) === JSON.stringify(sorted(right.children))
  );
}

function sorted<T extends { id: string }>(items: T[]) {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}
