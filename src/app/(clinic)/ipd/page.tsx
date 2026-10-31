import { ModuleScreen } from '@/components/shell/module-screen';
import { findNavItem } from '@/lib/navigation';
import { requireAccess } from '@/lib/staff';

export const instant = false;

export const metadata = { title: 'IPD & beds' };

export default async function IpdPage() {
  await requireAccess('/ipd');
  return <ModuleScreen page={findNavItem('/ipd')} />;
}
