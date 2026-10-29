import { z } from "zod";

export const teamMemberFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  email: z.email("Email invalide."),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;

export const teamMemberEditSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  email: z.email("Email invalide."),
  password: z
    .string()
    .refine(
      (value) => value.length === 0 || value.length >= 6,
      "Le mot de passe doit contenir au moins 6 caractères.",
    ),
});

export type TeamMemberEditValues = z.infer<typeof teamMemberEditSchema>;