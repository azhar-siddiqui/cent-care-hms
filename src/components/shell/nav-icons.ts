import type { NavIcon } from '@/lib/navigation';

import {
  IconBed,
  IconCash,
  IconLayoutDashboard,
  IconPackages,
  IconPill,
  IconStethoscope,
  IconUsers,
  type Icon,
} from '@tabler/icons-react';

export const navIcons: Record<NavIcon, Icon> = {
  overview: IconLayoutDashboard,
  opd: IconStethoscope,
  ipd: IconBed,
  billing: IconPill,
  inventory: IconPackages,
  expenses: IconCash,
  staff: IconUsers,
};
