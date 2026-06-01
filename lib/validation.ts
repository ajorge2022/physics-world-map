import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const profileInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  university_origin: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  current_city: z.string().trim().min(2).max(160),
  country: z.string().trim().min(2).max(160),
  current_institution: z.preprocess(emptyToUndefined, z.string().trim().max(220).optional()),
  position: z.preprocess(emptyToUndefined, z.string().trim().max(160).optional()),
  research_field: z.preprocess(emptyToUndefined, z.string().trim().max(180).optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email().max(220).optional()),
  show_email: z.coerce.boolean().default(false),
  website: z.preprocess(emptyToUndefined, z.string().trim().url().max(300).optional()),
  orcid: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^(\d{4}-){3}\d{3}[\dX]$/i, "Use the ORCID format 0000-0000-0000-0000.")
      .optional()
  ),
  linkedin: z.preprocess(emptyToUndefined, z.string().trim().url().max(300).optional()),
  year_left_university: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional()
  ),
  latitude: z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional()),
  longitude: z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional()),
  consent_given: z.coerce.boolean().refine(Boolean, "Consent is required.")
});

export const editLookupSchema = z.object({
  identifier: z.string().trim().min(2).max(220),
  edit_code: z.string().trim().min(16).max(80)
});

export const updateProfileSchema = profileInputSchema.extend({
  id: z.string().uuid(),
  edit_code: z.string().trim().min(16).max(80),
  is_public: z.coerce.boolean().default(true)
});

export const adminActionSchema = z.object({
  admin_password: z.string().min(1),
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "hide", "delete"])
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
