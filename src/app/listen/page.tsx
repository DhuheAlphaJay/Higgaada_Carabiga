import type { Metadata } from "next";
import { ListenPickGame } from "@/components/game/ListenPickGame";

export const metadata: Metadata = {
  title: "Dhageyso oo Dooro",
};

export default function ListenPage() {
  return <ListenPickGame />;
}
