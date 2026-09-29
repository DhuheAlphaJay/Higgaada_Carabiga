const SESSION_KEY = "xuruuf-parent-session";
const UNLOCK_EVENT = "xuruuf-parent-unlock";

let memoryUnlock = false;

export function isParentUnlocked() {
  if (memoryUnlock) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockParentSession() {
  memoryUnlock = true;
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    memoryUnlock = true;
  }
  window.dispatchEvent(new Event(UNLOCK_EVENT));
}

export function subscribeParentGate(onStoreChange: () => void) {
  window.addEventListener(UNLOCK_EVENT, onStoreChange);
  return () => window.removeEventListener(UNLOCK_EVENT, onStoreChange);
}
