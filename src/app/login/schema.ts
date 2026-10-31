import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .max(200, 'Enter the staff email.')
    .refine((value) => value.length > 0, 'Enter the staff email.')
    .refine(
      (value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Enter a valid email.',
    ),
  password: z.string().min(1, 'Enter the password.').max(200, 'Enter the password.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
