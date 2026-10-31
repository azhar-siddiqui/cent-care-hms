import { ModuleScreen } from '@/components/shell/module-screen';
import { findNavItem } from '@/lib/navigation';
import { requireAccess } from '@/lib/staff';

export const instant = false;

export const metadata = { title: 'OPD' };

export default async function OpdPage() {
  await requireAccess('/opd');
  return <ModuleScreen page={findNavItem('/opd')} />;
}
