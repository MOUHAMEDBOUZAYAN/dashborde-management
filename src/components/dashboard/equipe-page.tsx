"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Instrument_Serif } from "next/font/google";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  IconPencil,
  IconTrash,
  IconUserPlus,
} from "@/components/layout/nav-icons";
import { Modal } from "@/components/ui/modal";
import { readErrorMessage } from "@/lib/auth-api";
import { t } from "@/lib/i18n";
import {
  createTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
  teamMembersQueryKey,
  updateTeamMember,
} from "@/lib/team-api";
import {
  teamMemberEditSchema,
  teamMemberFormSchema,
  type TeamMemberEditValues,
  type TeamMemberFormValues,
} from "@/lib/team-member-schema";
import { usePortalLocale } from "@/lib/use-portal-locale";
import { zodFormResolver } from "@/lib/zod-resolver";
import type { TeamMember } from "@/types";

const displaySerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

function isEditableMember(member: TeamMember) {
  return member.role === "member" && !member.is_you;
}

export function EquipePageView() {
  const queryClient = useQueryClient();
  const { locale } = usePortalLocale();
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(
    null,
  );

  const membersQuery = useQuery({
    queryKey: teamMembersQueryKey,
    queryFn: fetchTeamMembers,
  });

  const createMutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamMembersQueryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: TeamMemberEditValues;
    }) =>
      updateTeamMember(id, {
        name: input.name,
        email: input.email,
        password: input.password.trim() ? input.password : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamMembersQueryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTeamMember(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamMembersQueryKey });
    },
  });

  const rows: TeamMember[] = membersQuery.data ?? [];
  const listError = membersQuery.isError
    ? readErrorMessage(
        membersQuery.error,
        "Impossible de charger l'équipe.",
      )
    : null;
  const createError = createMutation.isError
    ? readErrorMessage(
        createMutation.error,
        "Impossible d'ajouter le membre.",
      )
    : null;
  const updateError = updateMutation.isError
    ? readErrorMessage(
        updateMutation.error,
        "Impossible de modifier le membre.",
      )
    : null;
  const deleteError = deleteMutation.isError
    ? readErrorMessage(
        deleteMutation.error,
        "Impossible de supprimer le membre.",
      )
    : null;

  return (
    <section className="dash-v-scroll mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-8 overflow-y-auto pb-4">
      <section className="space-y-4">
        <h2
          className={`${displaySerif.className} text-2xl tracking-tight sm:text-3xl`}
          style={{ color: "var(--dash-text)" }}
        >
          Membres de l&apos;équipe
        </h2>

        {membersQuery.isLoading ? (
          <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
            {t(locale, "loading")}
          </p>
        ) : listError ? (
          <p
            className="rounded-2xl border px-4 py-6 text-center text-sm"
            style={{
              borderColor: "rgba(248, 113, 113, 0.35)",
              backgroundColor: "rgba(248, 113, 113, 0.08)",
              color: "#f87171",
            }}
            role="alert"
          >
            {listError}
          </p>
        ) : rows.length === 0 ? (
          <p
            className="rounded-2xl border px-4 py-6 text-center text-sm"
            style={{
              borderColor: "var(--dash-border)",
              backgroundColor: "var(--dash-surface)",
              color: "var(--dash-muted)",
            }}
          >
            Aucun membre pour le moment.
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.map((member) => {
              const canManage = isEditableMember(member);
              return (
                <li
                  key={member.id}
                  className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0"
                  style={{ borderColor: "var(--dash-border)" }}
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--dash-text)" }}
                    >
                      {member.name}
                      {member.is_you ? (
                        <span style={{ color: "var(--dash-muted)" }}>
                          {" "}
                          (vous)
                        </span>
                      ) : null}
                    </p>
                    <p
                      className="mt-0.5 truncate text-sm"
                      style={{ color: "var(--dash-muted)" }}
                    >
                      {member.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pt-0.5">
                    <span
                      className="text-sm"
                      style={{ color: "var(--dash-muted)" }}
                    >
                      {member.role === "owner" ? "Propriétaire" : "Membre"}
                    </span>
                    {canManage ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Modifier ${member.name}`}
                          title="Modifier"
                          onClick={() => {
                            updateMutation.reset();
                            setEditingMember(member);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-80"
                          style={{
                            borderColor: "var(--dash-border)",
                            color: "var(--dash-text)",
                            backgroundColor: "var(--dash-field)",
                          }}
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Supprimer ${member.name}`}
                          title="Supprimer"
                          onClick={() => {
                            deleteMutation.reset();
                            setDeletingMember(member);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-opacity hover:opacity-80"
                          style={{
                            borderColor: "var(--dash-border)",
                            color: "#ef4444",
                            backgroundColor: "var(--dash-field)",
                          }}
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AddMemberForm
        submitting={createMutation.isPending}
        error={createError}
        onSubmit={(values, reset) => {
          createMutation.mutate(values, {
            onSuccess: () => {
              reset();
              createMutation.reset();
            },
          });
        }}
      />

      <EditMemberModal
        member={editingMember}
        submitting={updateMutation.isPending}
        error={updateError}
        onClose={() => {
          if (updateMutation.isPending) return;
          setEditingMember(null);
          updateMutation.reset();
        }}
        onSubmit={(values) => {
          if (!editingMember) return;
          updateMutation.mutate(
            { id: editingMember.id, input: values },
            {
              onSuccess: () => {
                setEditingMember(null);
                updateMutation.reset();
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingMember)}
        title="Supprimer le membre"
        message={
          deletingMember
            ? `Es-tu sûr de vouloir supprimer « ${deletingMember.name} » ? Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        submitting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          if (deleteMutation.isPending) return;
          setDeletingMember(null);
          deleteMutation.reset();
        }}
        onConfirm={() => {
          if (!deletingMember) return;
          deleteMutation.mutate(deletingMember.id, {
            onSuccess: () => {
              setDeletingMember(null);
              deleteMutation.reset();
            },
          });
        }}
      />
    </section>
  );
}

function AddMemberForm({
  submitting,
  error,
  onSubmit,
}: {
  submitting: boolean;
  error: string | null;
  onSubmit: (values: TeamMemberFormValues, reset: () => void) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<TeamMemberFormValues>({
    resolver: zodFormResolver(teamMemberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const name = watch("name");
  const email = watch("email");
  const password = watch("password");
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    !submitting;

  return (
    <section className="space-y-4">
      <div>
        <h2
          className={`${displaySerif.className} text-2xl tracking-tight sm:text-3xl`}
          style={{ color: "var(--dash-text)" }}
        >
          Ajouter un membre
        </h2>
        <p
          className="mt-2 max-w-xl text-sm leading-6"
          style={{ color: "var(--dash-muted)" }}
        >
          Votre collaborateur se connecte avec cet email et ce mot de passe. Il
          ne voit que les pipelines que vous lui attribuez (réglages de chaque
          pipeline, via l&apos;engrenage).
        </p>
      </div>

      <form
        className="space-y-3.5"
        onSubmit={handleSubmit((values) => onSubmit(values, reset))}
      >
        <Field id="member-name" label="Nom" error={errors.name?.message}>
          <input
            id="member-name"
            autoComplete="name"
            className={fieldClassName}
            style={fieldStyle}
            {...register("name")}
          />
        </Field>

        <Field id="member-email" label="Email" error={errors.email?.message}>
          <input
            id="member-email"
            type="email"
            autoComplete="email"
            className={fieldClassName}
            style={fieldStyle}
            {...register("email")}
          />
        </Field>

        <Field
          id="member-password"
          label="Password"
          error={errors.password?.message}
        >
          <input
            id="member-password"
            type="password"
            autoComplete="new-password"
            className={fieldClassName}
            style={fieldStyle}
            {...register("password")}
          />
        </Field>

        {error ? (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold disabled:opacity-50"
          style={{
            backgroundColor: "var(--login-cream)",
            color: "#1c1814",
          }}
        >
          <IconUserPlus className="h-4 w-4" />
          {submitting ? "Ajout…" : "Ajouter le membre"}
        </button>
      </form>
    </section>
  );
}

function EditMemberModal({
  member,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  member: TeamMember | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: TeamMemberEditValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TeamMemberEditValues>({
    resolver: zodFormResolver(teamMemberEditSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!member) return;
    reset({
      name: member.name,
      email: member.email,
      password: "",
    });
  }, [member, reset]);

  const name = watch("name");
  const email = watch("email");
  const password = watch("password");
  const canSubmit =
    Boolean(member) &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    (password.length === 0 || password.length >= 6) &&
    !submitting;

  return (
    <Modal
      open={Boolean(member)}
      title="Modifier le membre"
      onClose={onClose}
      closeOnBackdrop={!submitting}
      size="sm"
    >
      <form
        className="space-y-3.5"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <Field id="edit-member-name" label="Nom" error={errors.name?.message}>
          <input
            id="edit-member-name"
            autoComplete="name"
            className={fieldClassName}
            style={fieldStyle}
            {...register("name")}
          />
        </Field>

        <Field
          id="edit-member-email"
          label="Email"
          error={errors.email?.message}
        >
          <input
            id="edit-member-email"
            type="email"
            autoComplete="email"
            className={fieldClassName}
            style={fieldStyle}
            {...register("email")}
          />
        </Field>

        <Field
          id="edit-member-password"
          label="Password"
          error={errors.password?.message}
          hint="Laisser vide pour ne pas changer"
        >
          <input
            id="edit-member-password"
            type="password"
            autoComplete="new-password"
            className={fieldClassName}
            style={fieldStyle}
            {...register("password")}
          />
        </Field>

        {error ? (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-xl border px-4 text-sm font-medium disabled:opacity-60"
            style={{
              borderColor: "var(--dash-border)",
              color: "var(--dash-text)",
              backgroundColor: "transparent",
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-10 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--login-cream)",
              color: "#1c1814",
            }}
          >
            {submitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium"
        style={{ color: "var(--dash-text)" }}
      >
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
          {hint}
        </p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

const fieldClassName =
  "h-11 w-full rounded-xl border px-3.5 text-sm outline-none";

const fieldStyle = {
  backgroundColor: "var(--dash-field)",
  borderColor: "var(--dash-border)",
  color: "var(--dash-text)",
} as const;
