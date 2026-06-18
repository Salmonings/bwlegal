import { LoginForm } from "@/app/login/login-form";
import { t } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-cream p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-orange">{t.appName}</h1>
        <p className="mt-1 text-sm text-muted">{t.loginSubtitle}</p>
      </div>
      <LoginForm redirectTo={redirectTo || "/"} t={t} />
    </main>
  );
}
