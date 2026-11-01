import { z } from 'zod';

export const acceptInviteSchema = z
  .object({
    token: z.string().trim().min(20).max(200),
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter the full name.')
      .max(120, 'Use at most 120 characters.'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(200, 'Use at most 200 characters.'),
    confirmPassword: z.string().min(1, 'Repeat the password.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type AcceptInviteValues = z.infer<typeof acceptInviteSchema>;
