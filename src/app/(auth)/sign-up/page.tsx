import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "Cadastro - FinalizaBOT",
  description: "Cadastre-se para começar a analisar finalizações de jogadores",
};

export default function SignUpPage() {
  return (
    <AuthLayout
      heading="Comece agora"
      subheading="Cadastre-se para acessar análises completas de finalizações"
    >
      <SignUp />
    </AuthLayout>
  );
}
