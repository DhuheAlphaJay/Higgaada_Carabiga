import type { Metadata } from "next";
import { SpellGame } from "@/components/game/SpellGame";

export const metadata: Metadata = {
  title: "Isku Dubarid Xarfaha",
};

export default function SpellPage() {
  return <SpellGame />;
}
