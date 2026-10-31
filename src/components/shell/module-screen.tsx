import type { NavItem } from '@/lib/navigation';

import { navIcons } from '@/components/shell/nav-icons';
import { PageHeader } from '@/components/shell/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function ModuleScreen({ page }: { page: NavItem }) {
  const IconComponent = navIcons[page.icon];

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <Empty className="min-h-80 border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconComponent stroke={1.75} />
          </EmptyMedia>
          <EmptyTitle>Not open yet</EmptyTitle>
          <EmptyDescription className="text-sm">{page.empty}</EmptyDescription>
        </EmptyHeader>
        <Badge variant="secondary">Next on the desk</Badge>
      </Empty>
    </>
  );
}
