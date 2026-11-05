import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type LegalShellProps = {
  title: string;
  children: ReactNode;
};

export function LegalShell({ title, children }: LegalShellProps) {
  return (
    <main
      className="login-theme-dark relative flex min-h-dvh flex-1 flex-col"
      style={{
        backgroundColor: "var(--login-stage)",
        color: "var(--login-text)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--login-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--login-grid) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, var(--login-stage-mid) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 flex flex-col items-center text-center sm:mb-12">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <Image
              src="/images/63.png"
              alt="63 Agency"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-[10px]"
            />
            <span
              className="dash-display text-3xl leading-none"
              style={{ color: "var(--login-text)" }}
            >
              63 Agency
            </span>
          </Link>
          <p
            className="dash-label mt-4 text-[10px] font-medium tracking-[0.2em] uppercase"
            style={{ color: "var(--login-gold-muted)" }}
          >
            Portail client
          </p>
        </header>

        <article
          className="rounded-2xl px-5 py-7 sm:px-8 sm:py-9"
          style={{
            backgroundColor: "var(--login-card)",
            border: "1px solid var(--login-card-border)",
            boxShadow: "var(--login-shadow)",
            backdropFilter: "blur(18px)",
          }}
        >
          <h1
            className="dash-display text-3xl leading-tight sm:text-4xl"
            style={{ color: "var(--login-cream)" }}
          >
            {title}
          </h1>
          <div
            className="mt-6 space-y-6 text-sm leading-relaxed sm:text-[0.95rem]"
            style={{ color: "var(--login-muted)" }}
          >
            {children}
          </div>
        </article>

        <footer
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs"
          style={{ color: "var(--login-muted)" }}
        >
          <Link
            href="/privacy"
            className="transition-colors hover:opacity-90"
            style={{ color: "var(--login-gold-muted)" }}
          >
            Politique de confidentialité
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/data-deletion"
            className="transition-colors hover:opacity-90"
            style={{ color: "var(--login-gold-muted)" }}
          >
            Suppression des données
          </Link>
        </footer>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2
        className="dash-display mb-2 text-xl leading-snug sm:text-2xl"
        style={{ color: "var(--login-text)" }}
      >
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
