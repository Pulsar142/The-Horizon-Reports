import { redirect } from "next/navigation";
import { LoginForm } from "@/app/components/LoginForm";
import { siteLoginAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; inviteFailed?: string; next?: string }>;
}) {
  const { invite, inviteFailed, next } = await searchParams;

  if (invite && !inviteFailed) {
    redirect(`/api/auth/invite?token=${encodeURIComponent(invite)}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 dot-grid">
      <div className="w-full max-w-sm rounded-lg border border-border bg-panel p-8 shadow-2xl">
        <p className="mb-1 text-center font-mono text-xs tracking-[0.3em] text-gold">
          OPEN-SOURCE WEEKLY NEWS UPDATE
        </p>
        <h1 className="stencil mb-6 text-center text-2xl text-foreground">
          The Horizon Reports
        </h1>
        {inviteFailed && (
          <p className="mb-4 text-sm text-danger font-mono">
            That invite link is invalid or has been revoked. Enter the site password below.
          </p>
        )}
        <LoginForm action={siteLoginAction} next={next} submitLabel="Enter" />
      </div>
    </main>
  );
}
