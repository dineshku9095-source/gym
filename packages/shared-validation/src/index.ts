import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[0-9]/, 'Password needs a number');

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(32).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const memberIdSchema = z
  .string()
  .regex(/^GYM-[A-Z0-9]{6}$/i, 'Member ID must look like GYM-7K92P4');

export const checkInSchema = z.object({
  memberId: memberIdSchema,
  overrideReason: z.string().min(3).max(500).optional(),
  notes: z.string().max(500).optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  durationDays: z.number().int().positive().max(3650),
  price: z.number().nonnegative(),
  currency: z.string().length(3).default('INR'),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const recordPaymentSchema = z.object({
  gymMemberId: z.string().min(1),
  membershipId: z.string().optional(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']),
  status: z
    .enum(['PENDING', 'COMPLETED', 'PARTIAL', 'CANCELLED', 'CORRECTED'])
    .optional(),
  paidAt: z.string().datetime().optional(),
  referenceNumber: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export const createGymSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(5000).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  country: z.string().max(2).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  timezone: z.string().max(64).optional(),
  coverUrl: z.string().url().optional(),
});

export const requestMembershipSchema = z.object({
  planId: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().max(32).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateGymInput = z.infer<typeof createGymSchema>;
