'use client';

import { signOut } from '@/app/login/actions';
import { navIcons } from '@/components/shell/nav-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { canAccessPath, roleLabels, type StaffRoleName } from '@/lib/access';
import { IconLogout, IconSelector } from '@tabler/icons-react';
import Link from 'next/link';

export type DeskStaff = {
  fullName: string;
  email: string;
  role: StaffRoleName;
};

export function StaffMenu({
  staff,
  placement,
}: {
  staff: DeskStaff;
  placement: 'header' | 'sidebar';
}) {
  const { isMobile, state } = useSidebar();
  const mark = initials(staff.fullName);
  const role = roleLabels[staff.role];
  const OverviewIcon = navIcons.overview;
  const StaffIcon = navIcons.staff;
  const collapsed = placement === 'sidebar' && state === 'collapsed' && !isMobile;
  const side = placement === 'header' ? 'bottom' : collapsed ? 'right' : 'top';
  const align = placement === 'header' || collapsed ? 'end' : 'start';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          placement === 'header'
            ? 'flex max-w-56 items-center gap-2 rounded-lg py-1 pr-2 pl-1 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40'
            : 'flex w-full items-center gap-2 rounded-lg p-1.5 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0'
        }
      >
        <StaffMark>{mark}</StaffMark>
        <span
          className={
            placement === 'header'
              ? 'hidden min-w-0 md:block'
              : 'min-w-0 flex-1 group-data-[collapsible=icon]:hidden'
          }
        >
          <span className="block truncate text-sm font-medium leading-none">{staff.fullName}</span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{role}</span>
        </span>
        <IconSelector
          className={
            placement === 'header'
              ? 'hidden size-3.5 text-muted-foreground md:block'
              : 'size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden'
          }
          stroke={1.75}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} sideOffset={8} className="w-64">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <StaffMark>{mark}</StaffMark>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{staff.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{role}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-8 text-sm" render={<Link href="/" />}>
          <OverviewIcon stroke={1.75} />
          Overview
        </DropdownMenuItem>
        {canAccessPath(staff.role, '/staff') ? (
          <DropdownMenuItem className="min-h-8 text-sm" render={<Link href="/staff" />}>
            <StaffIcon stroke={1.75} />
            Staff access
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem
            variant="destructive"
            className="min-h-8 w-full text-sm"
            nativeButton
            render={<button type="submit" />}
          >
            <IconLogout stroke={1.75} />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StaffMark({ children }: { children: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[0.6875rem] font-semibold tracking-wide text-primary-foreground">
      {children}
    </span>
  );
}

function initials(fullName: string) {
  const letters = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '');

  return letters.join('').toUpperCase() || 'S';
}
