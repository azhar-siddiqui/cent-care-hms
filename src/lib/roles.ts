export const roleAccess = [
  {
    role: 'Super admin',
    access: 'Full control and admin invites. The seed creates the only super admin.',
  },
  {
    role: 'Admin',
    access:
      'Every receptionist, doctor, and nurse action, plus staff management. Maximum 3 admins.',
  },
  {
    role: 'Receptionist',
    access: 'OPD registration, fees, referring doctors, and IPD check-in or check-out.',
  },
  {
    role: 'Doctor',
    access: 'Treatment updates, dose logs, and clinical progress notes.',
  },
  {
    role: 'Nurse',
    access: 'Bed status, medication logs, and oxygen or vital entries.',
  },
] as const;
