import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">Branch Compliance</h1>
        <p className="text-sm text-gray-500">Sign in to manage compliance documents</p>
      </div>
      <LoginForm redirectTo={redirectTo || "/"} />
    </main>
  );
}
