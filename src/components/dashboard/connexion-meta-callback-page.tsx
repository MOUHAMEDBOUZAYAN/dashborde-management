"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { readErrorMessage } from "@/lib/auth-api";
import {
  metaStatusQueryKey,
  sendMetaCallback,
} from "@/lib/meta-api";

type CallbackPhase = "working" | "error";

export function ConnexionMetaCallbackPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [phase, setPhase] = useState<CallbackPhase>("working");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const oauthError = searchParams.get("error");
    const oauthDescription = searchParams.get("error_description");
    if (oauthError) {
      setPhase("error");
      setErrorMessage(
        oauthDescription?.trim() ||
          oauthError ||
          "La connexion Facebook a été refusée.",
      );
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !state) {
      setPhase("error");
      setErrorMessage(
        "Paramètres OAuth manquants (code ou state). Recommencez la connexion.",
      );
      return;
    }

    void (async () => {
      try {
        await sendMetaCallback(code, state);
        await queryClient.invalidateQueries({ queryKey: metaStatusQueryKey });
        router.replace("/dashboard/connexion-meta?connected=1");
      } catch (error) {
        setPhase("error");
        setErrorMessage(
          readErrorMessage(
            error,
            "Impossible de finaliser la connexion Meta.",
          ),
        );
      }
    })();
  }, [queryClient, router, searchParams]);

  if (phase === "error") {
    return (
      <section className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div
          className="w-full rounded-2xl border px-5 py-8"
          style={{
            borderColor: "rgba(248, 113, 113, 0.35)",
            backgroundColor: "var(--dash-surface)",
          }}
        >
          <p
            className="text-base font-semibold"
            style={{ color: "var(--dash-text)" }}
          >
            Connexion Meta échouée
          </p>
          <p
            className="mt-3 text-sm leading-6"
            style={{ color: "#f87171" }}
            role="alert"
          >
            {errorMessage}
          </p>
          <Link
            href="/dashboard/connexion-meta"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold"
            style={{
              backgroundColor: "var(--login-cream)",
              color: "#1c1814",
            }}
          >
            Retour à Connexion Meta
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
        Finalisation de la connexion Facebook…
      </p>
    </section>
  );
}
