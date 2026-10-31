import { ModuleScreen } from '@/components/shell/module-screen';
import { findNavItem } from '@/lib/navigation';
import { requireAccess } from '@/lib/staff';

export const instant = false;

export const metadata = { title: 'Expenses' };

export default async function ExpensesPage() {
  await requireAccess('/expenses');
  return <ModuleScreen page={findNavItem('/expenses')} />;
}
