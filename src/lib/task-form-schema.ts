import { z } from "zod";

export const taskFormSchema = z.object({
  lead_id: z.string().min(1, "Choisissez un lead."),
  task_type: z.enum([
    "appel",
    "rendez_vous",
    "whatsapp",
    "relance",
    "devis",
  ]),
  due_at: z.string().min(1, "La date est requise."),
  details: z.string().optional().default(""),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
