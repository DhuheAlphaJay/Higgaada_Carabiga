"use client";

import { useEffect } from "react";
import { startCloudSync } from "@/lib/sync/cloud";

export function CloudSync() {
  useEffect(() => {
    void startCloudSync();
  }, []);

  return null;
}
