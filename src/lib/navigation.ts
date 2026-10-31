export type NavIcon = 'overview' | 'opd' | 'ipd' | 'billing' | 'inventory' | 'expenses' | 'staff';

export type NavItem = {
  href: string;
  label: string;
  title: string;
  description: string;
  empty: string;
  icon: NavIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: 'Clinical',
    items: [
      {
        href: '/',
        label: 'Overview',
        title: 'Overview',
        description: 'Live counts from the hospital database.',
        empty: '',
        icon: 'overview',
      },
      {
        href: '/opd',
        label: 'OPD',
        title: 'Outpatient',
        description: 'Find a patient, register a visit, and record the consultation fee.',
        empty:
          'Registration and visit logging are the next clinical screen. Patient and visit tables are already in the database.',
        icon: 'opd',
      },
      {
        href: '/ipd',
        label: 'IPD & beds',
        title: 'Inpatient beds',
        description: 'Ward board, admission, dose logs, and discharge.',
        empty:
          'The bed board is next. Seeded beds are already stored as vacant across Day Care, General, ICU, and Semi-ICU / Deluxe.',
        icon: 'ipd',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        href: '/billing',
        label: 'Charges',
        title: 'Service charges',
        description: 'ECG, procedures, and daily oxygen use.',
        empty:
          'Charge entry opens after the visit and admission flows. Oxygen can be logged in cylinders or liters.',
        icon: 'billing',
      },
      {
        href: '/inventory',
        label: 'Inventory',
        title: 'Inventory',
        description: 'Stock on hand and items at the reorder level.',
        empty:
          'Quantity adjustments are next. Seeded stock is already available to count on the overview.',
        icon: 'inventory',
      },
      {
        href: '/expenses',
        label: 'Expenses',
        title: 'Daily expenses',
        description: 'Cash leaving the hospital, by category and payment method.',
        empty:
          'The expense form is next. Only admin staff will be able to enter and review a day’s outflow.',
        icon: 'expenses',
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        href: '/staff',
        label: 'Staff',
        title: 'Staff access',
        description: 'Who can work in each part of the hospital.',
        empty: '',
        icon: 'staff',
      },
    ],
  },
];

export const navItems = navSections.flatMap((section) => section.items);

export function findNavItem(pathname: string) {
  if (pathname === '/') {
    return navItems[0];
  }

  return (
    navItems.find((item) => item.href !== '/' && pathname.startsWith(item.href)) ?? navItems[0]
  );
}
