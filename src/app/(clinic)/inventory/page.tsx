import { ModuleScreen } from '@/components/shell/module-screen';
import { findNavItem } from '@/lib/navigation';
import { requireAccess } from '@/lib/staff';

export const instant = false;

export const metadata = { title: 'Inventory' };

export default async function InventoryPage() {
  await requireAccess('/inventory');
  return <ModuleScreen page={findNavItem('/inventory')} />;
}
