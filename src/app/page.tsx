import { redirect } from "next/navigation";

export default function RootPage() {
  // Redireciona para a landing page
  redirect("/(public)");
}