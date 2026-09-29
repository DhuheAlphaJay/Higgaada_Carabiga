export type AvatarId = "lion" | "rocket" | "cat" | "crown";

export type ChildProfile = {
  id: string;
  name: string;
  avatar: AvatarId;
  stars: number;
  lessonsCompleted: number;
};

export type ProfileState = {
  activeChildId: string | null;
  children: ChildProfile[];
  unassignedStars: number;
  unassignedLessons: number;
};

export const avatars: Array<{ id: AvatarId; emoji: string; label: string }> = [
  { id: "lion", emoji: "🦁", label: "Libaax" },
  { id: "rocket", emoji: "🚀", label: "Dayax-gacmeed" },
  { id: "cat", emoji: "🐱", label: "Bisad" },
  { id: "crown", emoji: "👑", label: "Boqor" },
];

const STORAGE_KEY = "xuruuf-profiles";
const LEGACY_STARS_KEY = "huruuf-stars";
const CHANGE_EVENT = "xuruuf-profiles-change";

export const emptyProfiles: ProfileState = {
  activeChildId: null,
  children: [],
  unassignedStars: 0,
  unassignedLessons: 0,
};

let snapshot: ProfileState = emptyProfiles;
let loaded = false;

function isAvatar(value: unknown): value is AvatarId {
  return value === "lion" || value === "rocket" || value === "cat" || value === "crown";
}

function parseState(raw: string): ProfileState | null {
  try {
    const data = JSON.parse(raw) as Partial<ProfileState>;
    if (!data || !Array.isArray(data.children)) return null;

    const children = data.children.flatMap((child) => {
      if (!child || typeof child.id !== "string" || typeof child.name !== "string" || !isAvatar(child.avatar)) {
        return [];
      }
      return [
        {
          id: child.id,
          name: child.name,
          avatar: child.avatar,
          stars: Number.isFinite(child.stars) ? Math.max(0, Math.floor(child.stars)) : 0,
          lessonsCompleted: Number.isFinite(child.lessonsCompleted)
            ? Math.max(0, Math.floor(child.lessonsCompleted))
            : 0,
        },
      ];
    });

    const activeChildId =
      typeof data.activeChildId === "string" && children.some((child) => child.id === data.activeChildId)
        ? data.activeChildId
        : null;

    return {
      activeChildId,
      children,
      unassignedStars: Number.isFinite(data.unassignedStars) ? Math.max(0, Math.floor(data.unassignedStars ?? 0)) : 0,
      unassignedLessons: Number.isFinite(data.unassignedLessons)
        ? Math.max(0, Math.floor(data.unassignedLessons ?? 0))
        : 0,
    };
  } catch {
    return null;
  }
}

function readLegacyStars() {
  try {
    const value = Number(window.localStorage.getItem(LEGACY_STARS_KEY) ?? "0");
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

function loadFromStorage(): ProfileState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return parseState(raw) ?? emptyProfiles;
    }
  } catch {
    return emptyProfiles;
  }

  const legacyStars = readLegacyStars();
  if (legacyStars <= 0) return emptyProfiles;

  const migrated: ProfileState = { ...emptyProfiles, unassignedStars: legacyStars };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    window.localStorage.removeItem(LEGACY_STARS_KEY);
  } catch {
    return migrated;
  }
  return migrated;
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  snapshot = loadFromStorage();
}

function commit(next: ProfileState, options?: { remote?: boolean }) {
  snapshot = next;
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.localStorage.removeItem(LEGACY_STARS_KEY);
  } catch {
    snapshot = next;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  if (!options?.remote) scheduleProfilePush();
}

function scheduleProfilePush() {
  if (typeof window === "undefined") return;
  void import("@/lib/firebase")
    .then((firebase) => {
      if (!firebase.isFirebaseConfigured()) return;
      return import("@/lib/sync/cloud").then((cloud) => {
        cloud.markProfilesDirty();
        return cloud.pushProfiles();
      });
    })
    .catch(() => undefined);
}

export function readProfiles() {
  ensureLoaded();
  return snapshot;
}

export function subscribeProfiles(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    loaded = false;
    ensureLoaded();
    onStoreChange();
  };

  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function avatarEmoji(avatar: AvatarId) {
  return avatars.find((item) => item.id === avatar)?.emoji ?? "🌟";
}

export function addChild(name: string, avatar: AvatarId) {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) return null;

  const state = readProfiles();
  const isFirst = state.children.length === 0;
  const child: ChildProfile = {
    id: crypto.randomUUID(),
    name: trimmed,
    avatar,
    stars: isFirst ? state.unassignedStars : 0,
    lessonsCompleted: isFirst ? state.unassignedLessons : 0,
  };

  commit({
    activeChildId: child.id,
    children: [...state.children, child],
    unassignedStars: isFirst ? 0 : state.unassignedStars,
    unassignedLessons: isFirst ? 0 : state.unassignedLessons,
  });

  return child;
}

export function setActiveChild(id: string) {
  const state = readProfiles();
  if (!state.children.some((child) => child.id === id)) return;
  commit({ ...state, activeChildId: id });
}

function updateActive(update: (child: ChildProfile) => ChildProfile, unassignedKey: "unassignedStars" | "unassignedLessons", amount: number) {
  const state = readProfiles();
  if (!state.activeChildId) {
    commit({ ...state, [unassignedKey]: state[unassignedKey] + amount });
    return;
  }

  commit({
    ...state,
    children: state.children.map((child) => (child.id === state.activeChildId ? update(child) : child)),
  });
}

export function addStars(amount: number) {
  updateActive((child) => ({ ...child, stars: child.stars + amount }), "unassignedStars", amount);
}

export function addLesson() {
  updateActive(
    (child) => ({ ...child, lessonsCompleted: child.lessonsCompleted + 1 }),
    "unassignedLessons",
    1,
  );
}

export function deleteChild(id: string) {
  const state = readProfiles();
  const children = state.children.filter((child) => child.id !== id);
  const activeChildId =
    state.activeChildId === id ? (children[0]?.id ?? null) : state.activeChildId;
  commit({ ...state, children, activeChildId });
}

export function resetChild(id: string) {
  const state = readProfiles();
  if (!state.children.some((child) => child.id === id)) return;
  commit({
    ...state,
    children: state.children.map((child) =>
      child.id === id ? { ...child, stars: 0, lessonsCompleted: 0 } : child,
    ),
  });
}

export function replaceProfiles(next: ProfileState) {
  commit(next, { remote: true });
}

export function childLevel(child: ChildProfile) {
  if (child.lessonsCompleted >= 12 || child.stars >= 30) return "Horumar" as const;
  if (child.lessonsCompleted >= 4 || child.stars >= 10) return "Dhexe" as const;
  return "Bilow" as const;
}
