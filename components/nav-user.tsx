"use client";

import {
  // IconCreditCard,
  IconDotsVertical,
  // IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LogoutButton } from "@/components/logout-button";
import { SidebarUser } from "@/types/user";
import Link from "next/link";

export function NavUser({
  user,
  collapsed = false,
  homeUrl = "",
}: {
  user: SidebarUser;
  collapsed?: boolean;
  homeUrl?: string;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex justify-between items-center data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 mx-2 rounded-lg">
                <AvatarImage src={user.avatar || "/database.png"} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-1">
                  <Image 
                    src="/database.png"
                    alt={user.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="truncate font-medium">{user.name}</span>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded border border-blue-200 whitespace-nowrap"
                        >
                          {role}
                        </span>
                      ))
                    ) : user.role ? (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded border border-blue-200">
                        {user.role}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              )}
              <IconDotsVertical className="ml-auto size-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || "/database.png"} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-1">
                    <Image 
                      src="/database.png"
                      alt={user.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="truncate font-medium">{user.name}</span>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded border border-blue-200 whitespace-nowrap"
                        >
                          {role}
                        </span>
                      ))
                    ) : user.role ? (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded border border-blue-200">
                        {user.role}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href={`${homeUrl}/minha-conta`}
                  className="flex items-center gap-2"
                >
                  <IconUserCircle />
                  <span>Minha Conta</span>
                </Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <IconCreditCard />
                Financeiro
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notificações
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
