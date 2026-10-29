import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Entrez une adresse email valide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type LoginValues = z.infer<typeof loginSchema>;
