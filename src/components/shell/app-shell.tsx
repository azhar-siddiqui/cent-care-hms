'use client';

import { ClinicSidebar } from '@/components/shell/sidebar-nav';
import { StaffMenu, type DeskStaff } from '@/components/shell/staff-menu';
import { TodayLabel } from '@/components/shell/today-label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { findNavItem, type NavSection } from '@/lib/navigation';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AppShell({
  children,
  staff,
  sections,
}: {
  children: React.ReactNode;
  staff: DeskStaff;
  sections: NavSection[];
}) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <ClinicSidebar sections={sections} staff={staff} />
      <ShellFrame staff={staff} sections={sections}>
        {children}
      </ShellFrame>
    </SidebarProvider>
  );
}

function ShellFrame({
  children,
  staff,
  sections,
}: {
  children: React.ReactNode;
  staff: DeskStaff;
  sections: NavSection[];
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const current = findNavItem(pathname);
  const section = sections.find((item) => item.items.some((link) => link.href === current.href));

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <SidebarInset className="min-h-0 overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 md:px-4">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="h-4 data-vertical:h-4 data-vertical:self-center"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap text-sm">
            {section ? (
              <>
                <BreadcrumbItem className="hidden sm:inline-flex">{section.label}</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
              </>
            ) : null}
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate font-medium">{current.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <TodayLabel />
          <StaffMenu staff={staff} placement="header" />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">{children}</div>
    </SidebarInset>
  );
}
