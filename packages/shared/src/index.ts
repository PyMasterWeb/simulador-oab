import { z } from "zod";

export const planSchema = z.enum(["FREE", "PREMIUM"]);
export const roleSchema = z.enum(["STUDENT", "ADMIN"]);

export const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  consentMarketing: z.boolean(),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional()
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  consentMarketing: z.boolean(),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type LeadInput = z.infer<typeof leadSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
