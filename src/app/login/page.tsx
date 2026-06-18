import { LoginForm } from "@/app/login/login-form";
import { LanguageToggle } from "@/components/language-toggle";
import { getDictionary } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  const { locale, t } = await getDictionary();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-cream p-6">
      <div className="absolute top-6 end-6">
        <LanguageToggle locale={locale} />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-orange">{t.appName}</h1>
        <p className="mt-1 text-sm text-muted">{t.loginSubtitle}</p>
      </div>
      <LoginForm redirectTo={redirectTo || "/"} t={t} />
    </main>
  );
}
