import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  phone: z.string().default(""),
  email: z
    .string()
    .default("")
    .refine(
      (value) => value.trim() === "" || z.email().safeParse(value).success,
      "Email invalide.",
    ),
  campaign: z.string().default(""),
  estimated_value: z
    .string()
    .default("")
    .refine(
      (value) => value.trim() === "" || !Number.isNaN(Number(value)),
      "Valeur numérique invalide.",
    ),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
