import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cadastrar - FinalizaBOT",
  description: "Crie sua conta para acessar analises",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">FinalizaBOT</h2>
          <p className="mt-2 text-gray-600">Cadastro em desenvolvimento</p>
        </div>
        <div className="mt-8">
          <Link 
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Voltar para Home
          </Link>
        </div>
      </div>
    </div>
  );
}
