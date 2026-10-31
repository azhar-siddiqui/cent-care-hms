'use client';

import { navIcons } from '@/components/shell/nav-icons';
import { StaffMenu, type DeskStaff } from '@/components/shell/staff-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { findNavItem, type NavSection } from '@/lib/navigation';
import { IconBuildingHospital } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ClinicSidebar({ sections, staff }: { sections: NavSection[]; staff: DeskStaff }) {
  const pathname = usePathname();
  const current = findNavItem(pathname);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="CentCare Pro" render={<Link href="/" />}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <IconBuildingHospital className="size-4" stroke={1.75} />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">CentCare Pro</span>
                <span className="truncate text-xs text-muted-foreground">Hospital desk</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const IconComponent = navIcons[item.icon];
                  const active = item.href === current.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        className="h-9 text-sm data-active:bg-primary/10 data-active:text-foreground"
                        aria-current={active ? 'page' : undefined}
                        render={<Link href={item.href} />}
                      >
                        <IconComponent
                          className="text-muted-foreground group-data-active/menu-button:text-primary"
                          stroke={1.75}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <StaffMenu staff={staff} placement="sidebar" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
