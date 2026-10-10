import type { Metadata } from "next";
import { TraceStudio } from "@/components/trace/TraceStudio";

export const metadata: Metadata = {
  title: "Farbarashada & Qorista",
};

export default function TracePage() {
  return <TraceStudio />;
}
