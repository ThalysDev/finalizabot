import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
}

export function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">FB</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {heading}
          </h1>
          <p className="text-gray-600">{subheading}</p>
        </div>

        {/* Clerk Components */}
        <ClerkLoading>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </ClerkLoading>

        <ClerkLoaded>{children}</ClerkLoaded>

        {/* Footer link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            FinalizaBOT © {new Date().getFullYear()}{" "}
            <a href="/" className="text-blue-600 hover:text-blue-700">
              Voltar para home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
