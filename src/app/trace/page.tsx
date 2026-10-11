import type { Metadata } from "next";
import { TraceStudio } from "@/components/trace/TraceStudio";

export const metadata: Metadata = {
  title: "Farbarashada & Qorista",
};

export default async function TracePage({ searchParams }: { searchParams: Promise<{ letter?: string }> }) {
  const params = await searchParams;
  const letterId = typeof params.letter === "string" ? params.letter : null;
  return <TraceStudio letterId={letterId} />;
}
