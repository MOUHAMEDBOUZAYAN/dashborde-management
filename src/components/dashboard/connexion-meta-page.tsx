"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { IconMeta } from "@/components/layout/nav-icons";
import { readErrorMessage } from "@/lib/auth-api";
import { t } from "@/lib/i18n";
import {
  disconnectMeta,
  getMetaConnectUrl,
  getMetaStatus,
  metaStatusQueryKey,
  toggleMetaForm,
  type MetaForm,
  type MetaPage,
} from "@/lib/meta-api";
import { usePortalLocale } from "@/lib/use-portal-locale";

export function ConnexionMetaPageView() {
  const queryClient = useQueryClient();
  const { locale } = usePortalLocale();
  const searchParams = useSearchParams();
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [togglingFormId, setTogglingFormId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      setSuccessBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  const statusQuery = useQuery({
    queryKey: metaStatusQueryKey,
    queryFn: getMetaStatus,
  });

  const connectMutation = useMutation({
    mutationFn: getMetaConnectUrl,
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error) => {
      setConnectError(
        readErrorMessage(error, "Impossible d'ouvrir la connexion Facebook."),
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      formId,
      isLinked,
    }: {
      formId: string;
      isLinked: boolean;
    }) => toggleMetaForm(formId, isLinked),
    onMutate: ({ formId }) => {
      setTogglingFormId(formId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: metaStatusQueryKey });
    },
    onSettled: () => {
      setTogglingFormId(null);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectMeta,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: metaStatusQueryKey });
      setDisconnectOpen(false);
      setSuccessBanner(false);
    },
  });

  const status = statusQuery.data;
  const pages = status?.pages ?? [];
  const forms = status?.forms ?? [];

  const formsByPage = useMemo(() => {
    const map = new Map<string, MetaForm[]>();
    for (const form of forms) {
      const list = map.get(form.page_id) ?? [];
      list.push(form);
      map.set(form.page_id, list);
    }
    return map;
  }, [forms]);

  const loading = statusQuery.isLoading;
  const statusError = statusQuery.isError
    ? readErrorMessage(
        statusQuery.error,
        "Impossible de charger le statut Meta.",
      )
    : null;
  const toggleError = toggleMutation.isError
    ? readErrorMessage(
        toggleMutation.error,
        "Impossible de mettre à jour le formulaire.",
      )
    : null;
  const disconnectError = disconnectMutation.isError
    ? readErrorMessage(
        disconnectMutation.error,
        "Impossible de déconnecter Meta.",
      )
    : null;

  return (
    <section className="dash-v-scroll mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-6 overflow-y-auto pb-4">
      {successBanner ? (
        <p
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "color-mix(in srgb, #22c55e 35%, transparent)",
            backgroundColor: "color-mix(in srgb, #22c55e 12%, transparent)",
            color: "#4ade80",
          }}
          role="status"
        >
          Compte Facebook connecté. Choisissez les formulaires à importer.
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
          {t(locale, "loading")}
        </p>
      ) : statusError ? (
        <p
          className="rounded-2xl border px-4 py-6 text-center text-sm"
          style={{
            borderColor: "rgba(248, 113, 113, 0.35)",
            backgroundColor: "rgba(248, 113, 113, 0.08)",
            color: "#f87171",
          }}
          role="alert"
        >
          {statusError}
        </p>
      ) : status?.connected ? (
        <ConnectedView
          fbUserId={status.fb_user_id}
          pages={pages}
          formsByPage={formsByPage}
          togglingFormId={togglingFormId}
          toggleError={toggleError}
          onToggle={(formId, isLinked) => {
            toggleMutation.reset();
            toggleMutation.mutate({ formId, isLinked });
          }}
          onDisconnect={() => {
            disconnectMutation.reset();
            setDisconnectOpen(true);
          }}
        />
      ) : (
        <DisconnectedView
          connecting={connectMutation.isPending}
          error={connectError}
          onConnect={() => {
            setConnectError(null);
            connectMutation.mutate();
          }}
        />
      )}

      <ConfirmDialog
        open={disconnectOpen}
        title="Déconnecter Meta"
        message="Es-tu sûr de vouloir déconnecter ton compte Facebook ? L'import automatique des leads sera arrêté."
        confirmLabel="Déconnecter"
        cancelLabel="Annuler"
        destructive
        submitting={disconnectMutation.isPending}
        error={disconnectError}
        onCancel={() => {
          if (disconnectMutation.isPending) return;
          setDisconnectOpen(false);
          disconnectMutation.reset();
        }}
        onConfirm={() => disconnectMutation.mutate()}
      />
    </section>
  );
}

function DisconnectedView({
  connecting,
  error,
  onConnect,
}: {
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl border px-5 py-10 text-center sm:px-8 sm:py-12"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
    >
      <span
        className="inline-flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--dash-gold-muted) 18%, transparent)",
          color: "var(--dash-gold-muted)",
        }}
        aria-hidden
      >
        <IconMeta className="h-7 w-7" />
      </span>

      <h2
        className={`dash-display mt-5 text-2xl tracking-tight sm:text-3xl`}
        style={{ color: "var(--dash-text)" }}
      >
        Connexion Meta
      </h2>
      <p
        className="mt-3 max-w-md text-sm leading-6"
        style={{ color: "var(--dash-muted)" }}
      >
        Connectez votre compte Facebook pour importer automatiquement les leads
        de vos formulaires publicitaires.
      </p>

      {error ? (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={connecting}
        onClick={onConnect}
        className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold disabled:opacity-50"
        style={{
          backgroundColor: "var(--login-cream)",
          color: "#1c1814",
        }}
      >
        <IconMeta className="h-4 w-4" />
        {connecting ? "Redirection…" : "Se connecter avec Facebook"}
      </button>
    </div>
  );
}

function ConnectedView({
  fbUserId,
  pages,
  formsByPage,
  togglingFormId,
  toggleError,
  onToggle,
  onDisconnect,
}: {
  fbUserId?: string;
  pages: MetaPage[];
  formsByPage: Map<string, MetaForm[]>;
  togglingFormId: string | null;
  toggleError: string | null;
  onToggle: (formId: string, isLinked: boolean) => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl border px-4 py-4 sm:px-5"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "var(--dash-surface)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className="text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--dash-muted)" }}
            >
              Statut
            </p>
            <p
              className="mt-1 text-sm font-semibold"
              style={{ color: "#4ade80" }}
            >
              Connecté
              {fbUserId ? (
                <span style={{ color: "var(--dash-muted)" }}>
                  {" "}
                  · {fbUserId}
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onDisconnect}
            className="h-9 rounded-xl border px-3.5 text-xs font-semibold"
            style={{
              borderColor: "rgba(248, 113, 113, 0.45)",
              color: "#f87171",
              backgroundColor: "transparent",
            }}
          >
            Déconnecter
          </button>
        </div>
      </div>

      {toggleError ? (
        <p className="text-sm text-red-500" role="alert">
          {toggleError}
        </p>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2
            className={`dash-display text-xl tracking-tight sm:text-2xl`}
            style={{ color: "var(--dash-text)" }}
          >
            Pages & formulaires
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--dash-muted)" }}>
            Activez l&apos;import pour chaque formulaire Lead Ads à synchroniser.
          </p>
        </div>

        {pages.length === 0 ? (
          <div
            className="rounded-2xl border px-4 py-8 text-center text-sm"
            style={{
              borderColor: "var(--dash-border)",
              backgroundColor: "var(--dash-surface)",
              color: "var(--dash-muted)",
            }}
          >
            Aucune page Facebook disponible pour ce compte.
          </div>
        ) : (
          <ul className="space-y-3">
            {pages.map((page) => {
              const pageForms = formsByPage.get(page.page_id) ?? [];
              return (
                <li
                  key={page.page_id}
                  className="rounded-2xl border"
                  style={{
                    borderColor: "var(--dash-border)",
                    backgroundColor: "var(--dash-surface)",
                  }}
                >
                  <div
                    className="border-b px-4 py-3"
                    style={{ borderColor: "var(--dash-border)" }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--dash-text)" }}
                    >
                      {page.page_name}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--dash-muted)" }}
                    >
                      {page.page_id}
                    </p>
                  </div>

                  {pageForms.length === 0 ? (
                    <p
                      className="px-4 py-4 text-sm"
                      style={{ color: "var(--dash-muted)" }}
                    >
                      Aucun formulaire Lead Ads sur cette page.
                    </p>
                  ) : (
                    <ul className="divide-y" style={{ borderColor: "var(--dash-border)" }}>
                      {pageForms.map((form) => (
                        <li
                          key={form.form_id}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                          style={{ borderColor: "var(--dash-border)" }}
                        >
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-medium"
                              style={{ color: "var(--dash-text)" }}
                            >
                              {form.form_name}
                            </p>
                            <p
                              className="mt-0.5 truncate text-xs"
                              style={{ color: "var(--dash-muted)" }}
                            >
                              {form.form_id}
                            </p>
                          </div>
                          <label className="flex shrink-0 cursor-pointer items-center gap-2.5">
                            <span
                              className="hidden text-xs sm:inline"
                              style={{ color: "var(--dash-muted)" }}
                            >
                              Importer les leads
                            </span>
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-(--dash-gold-muted)"
                              checked={form.is_linked}
                              disabled={togglingFormId === form.form_id}
                              aria-label={`Importer les leads — ${form.form_name}`}
                              onChange={(event) =>
                                onToggle(form.form_id, event.target.checked)
                              }
                            />
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
