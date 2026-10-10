import type { Metadata } from "next";
import { ChapterListenGame } from "@/components/game/ChapterListenGame";

export const metadata: Metadata = {
  title: "Dhageyso oo Dooro",
};

export default async function ChapterListenPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  return <ChapterListenGame level={level} />;
}
