import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/** Maps a Zod schema onto react-hook-form without an extra resolver package. */
export function zodFormResolver<T extends FieldValues>(
  schema: ZodType<T>,
): Resolver<T> {
  return (values) => {
    const parsed = schema.safeParse(values);

    if (parsed.success) {
      return { values: parsed.data, errors: {} };
    }

    const errors: Record<string, { type: string; message: string }> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field !== "string" || errors[field]) continue;
      errors[field] = { type: issue.code, message: issue.message };
    }

    return {
      values: {},
      errors: errors as FieldErrors<T>,
    };
  };
}
