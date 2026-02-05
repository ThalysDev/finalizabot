import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';
import { AuthLayout } from '@/components/auth/AuthLayout';

export const metadata: Metadata = {
  title: 'Entrar - FinalizaBOT',
  description: 'Entre na sua conta para acessar análises de finalizações',
};

export default function SignInPage() {
  return (
    <AuthLayout
      heading="Bem-vindo de volta"
      subheading="Entre para acompanhar seus jogadores favoritos"
    >
      <SignIn />
    </AuthLayout>
  );
}
