import type { Metadata } from "next";
import { ChapterView } from "@/components/learn/ChapterView";

export const metadata: Metadata = {
  title: "Waddada barashada",
};

export default async function LearnPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  return <ChapterView level={level} />;
}
