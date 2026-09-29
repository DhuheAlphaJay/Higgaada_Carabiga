"use client";

import { useSyncExternalStore } from "react";
import { emptyProfiles, readProfiles, subscribeProfiles } from "@/lib/profiles";

export function useProfiles() {
  return useSyncExternalStore(subscribeProfiles, readProfiles, () => emptyProfiles);
}

export function useActiveChild() {
  const state = useProfiles();
  return state.children.find((child) => child.id === state.activeChildId) ?? null;
}

export function useStars() {
  const state = useProfiles();
  const child = state.children.find((item) => item.id === state.activeChildId);
  return child?.stars ?? state.unassignedStars;
}
