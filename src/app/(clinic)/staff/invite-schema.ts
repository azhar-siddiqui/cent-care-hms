import { invitableRoles } from '@/lib/access';
import { z } from 'zod';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .max(200, 'Enter an email address.')
    .refine((value) => value.length > 0, 'Enter an email address.')
    .refine((value) => value.length === 0 || emailPattern.test(value), 'Enter a valid email.'),
  role: z.enum(invitableRoles, { error: 'Choose a role.' }),
});

export type InviteValues = z.infer<typeof inviteSchema>;
