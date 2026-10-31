import { ModuleScreen } from '@/components/shell/module-screen';
import { findNavItem } from '@/lib/navigation';
import { requireAccess } from '@/lib/staff';

export const instant = false;

export const metadata = { title: 'Charges' };

export default async function BillingPage() {
  await requireAccess('/billing');
  return <ModuleScreen page={findNavItem('/billing')} />;
}
