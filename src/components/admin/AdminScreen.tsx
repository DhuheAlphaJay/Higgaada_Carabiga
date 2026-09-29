"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ParentGate } from "@/components/admin/ParentGate";
import { isParentUnlocked, subscribeParentGate, unlockParentSession } from "@/lib/parentGate";

function subscribeHydration() {
  return () => undefined;
}

export function AdminScreen() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const unlocked = useSyncExternalStore(subscribeParentGate, isParentUnlocked, () => false);

  if (!hydrated) {
    return <main className="play-bg min-h-dvh" />;
  }

  if (!unlocked) {
    return (
      <main className="play-bg flex min-h-dvh items-center justify-center px-4 py-8">
        <ParentGate
          onUnlock={() => {
            unlockParentSession();
          }}
          onCancel={() => router.push("/")}
        />
      </main>
    );
  }

  return <AdminDashboard />;
}
