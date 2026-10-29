"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Instrument_Serif } from "next/font/google";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { StatusScreen } from "@/components/ui/status-screen";
import {
  clientMeQueryKey,
  fetchClientMe,
  loginWithPassword,
  readErrorMessage,
} from "@/lib/auth-api";
import { loginSchema, type LoginValues } from "@/lib/login-schema";
import { useAuthHydrated } from "@/lib/use-auth-hydrated";
import { usePortalTheme } from "@/lib/use-portal-theme";
import { zodFormResolver } from "@/lib/zod-resolver";
import { useAuthStore } from "@/store/auth-store";

const serif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export function LoginScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useAuthHydrated();
  const { className } = usePortalTheme();
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setClient = useAuthStore((state) => state.setClient);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodFormResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (hydrated && token && !isSubmitting) {
      router.replace("/dashboard");
    }
  }, [hydrated, token, isSubmitting, router]);

  if (!hydrated || (token && !isSubmitting)) {
    return <StatusScreen label="Chargement…" />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const accessToken = await loginWithPassword(values.email, values.password);
      setAuth(accessToken);

      try {
        const profile = await queryClient.fetchQuery({
          queryKey: clientMeQueryKey,
          queryFn: fetchClientMe,
          retry: false,
        });
        setClient(profile);
      } catch (profileError) {
        useAuthStore.getState().logout();
        throw profileError;
      }

      router.replace("/dashboard");
    } catch (error) {
      setFormError(readErrorMessage(error, "Connexion impossible."));
    }
  });

  return (
    <main
      className={`relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden px-3 py-8 sm:px-4 sm:py-12 ${className}`}
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
          background: `radial-gradient(ellipse at center, var(--login-stage-mid) 0%, transparent 62%)`,
        }}
      />

      <div
        className="relative z-10 w-full max-w-[360px] rounded-2xl px-5 py-6 sm:px-7 sm:py-8"
        style={{
          backgroundColor: "var(--login-card)",
          border: "1px solid var(--login-card-border)",
          boxShadow: "var(--login-shadow)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <Image
            src="/images/63.png"
            alt="63 Agency"
            width={44}
            height={44}
            priority
            className="h-11 w-11 rounded-[10px]"
          />
          <p
            className={`${serif.className} mt-3 text-[24px] leading-none`}
            style={{ color: "var(--login-text)" }}
          >
            63 Agency
          </p>

          <div className="mt-5 flex w-full items-center gap-2.5">
            <span
              className="h-px flex-1"
              style={{ backgroundColor: "var(--login-card-border)" }}
            />
            <span
              className="shrink-0 text-[10px] font-medium tracking-[0.2em] uppercase"
              style={{ color: "var(--login-gold-muted)" }}
            >
              Connexion client
            </span>
            <span
              className="h-px flex-1"
              style={{ backgroundColor: "var(--login-card-border)" }}
            />
          </div>
        </div>

        <form className="mt-5 text-left" onSubmit={onSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold"
              style={{ color: "var(--login-text)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vous@societe.com"
              className="mt-1.5 h-10 w-full rounded-lg px-3.5 text-sm outline-none transition-[border-color,box-shadow]"
              style={{
                backgroundColor: "var(--login-field)",
                border: "1px solid var(--login-field-border)",
                color: "var(--login-text)",
              }}
              aria-invalid={errors.email ? true : undefined}
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="mt-3.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold"
              style={{ color: "var(--login-text)" }}
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1.5 h-10 w-full rounded-lg px-3.5 text-sm outline-none transition-[border-color,box-shadow]"
              style={{
                backgroundColor: "var(--login-field)",
                border: "1px solid var(--login-field-border)",
                color: "var(--login-text)",
              }}
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="mt-3 text-xs text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--login-cream)",
              color: "#1c1814",
            }}
          >
            {isSubmitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div
          className="mt-5 h-px w-full"
          style={{ backgroundColor: "var(--login-card-border)" }}
        />

        <p
          className="mt-3.5 text-center text-[11px]"
          style={{ color: "var(--login-gold-muted)" }}
        >
          Pas encore d&apos;espace ? Créer un compte
        </p>
      </div>
    </main>
  );
}
