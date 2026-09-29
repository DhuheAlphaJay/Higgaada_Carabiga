import type { Metadata } from "next";
import { AdminScreen } from "@/components/admin/AdminScreen";

export const metadata: Metadata = {
  title: "Maamulka waalidka",
};

export default function AdminPage() {
  return <AdminScreen />;
}
