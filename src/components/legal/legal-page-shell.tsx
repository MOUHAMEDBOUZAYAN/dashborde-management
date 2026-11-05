import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div
      className="login-theme-dark min-h-dvh"
      style={{
        backgroundColor: "var(--dash-bg)",
        color: "var(--dash-text)",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--dash-gold-muted) 18%, transparent), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-10 flex flex-col items-center text-center sm:mb-12">
          <Link
            href="/login"
            className="inline-flex items-center gap-3 no-underline"
            style={{ color: "var(--dash-sidebar-text)" }}
          >
            <span
              className="inline-flex h-10 w-10 shrink-0 overflow-hidden"
              style={{ borderRadius: "32%" }}
            >
              <Image
                src="/images/63.png"
                alt="63 Agency"
                width={40}
                height={40}
                className="h-full w-full scale-[1.2] object-cover"
                style={{ borderRadius: "32%" }}
                priority
              />
            </span>
            <span className="dash-display text-2xl leading-none sm:text-3xl">
              <span style={{ color: "var(--dash-gold-muted)" }}>63</span>
              <span> Agency</span>
            </span>
          </Link>
          <h1 className="dash-display mt-8 text-3xl font-semibold leading-tight sm:text-4xl">
            {title}
          </h1>
        </header>

        <article
          className="rounded-2xl border px-5 py-7 sm:px-8 sm:py-9"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor:
              "color-mix(in srgb, var(--dash-surface) 88%, transparent)",
            boxShadow: "var(--dash-shadow)",
          }}
        >
          <div className="legal-prose space-y-8 text-sm leading-7 sm:text-[15px] sm:leading-7">
            {children}
          </div>
        </article>

        <footer
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs"
          style={{ color: "var(--dash-muted)" }}
        >
          <Link
            href="/privacy"
            className="underline-offset-2 hover:underline"
            style={{ color: "var(--dash-gold-muted)" }}
          >
            Confidentialité
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/data-deletion"
            className="underline-offset-2 hover:underline"
            style={{ color: "var(--dash-gold-muted)" }}
          >
            Suppression des données
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/login"
            className="underline-offset-2 hover:underline"
            style={{ color: "var(--dash-gold-muted)" }}
          >
            Connexion
          </Link>
        </footer>
      </div>
    </div>
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
        className="dash-display mb-3 text-xl font-semibold tracking-normal sm:text-2xl"
        style={{ color: "var(--dash-text)" }}
      >
        {title}
      </h2>
      <div style={{ color: "var(--dash-muted)" }}>{children}</div>
    </section>
  );
}
