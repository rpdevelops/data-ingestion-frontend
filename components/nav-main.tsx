"use client";

import { IconCirclePlusFilled } from "@tabler/icons-react";

//import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

export function NavMain({
  items,
  collapsed = false,
  showNewClientButton = false,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ComponentType<{ className?: string; size?: number }>;
  }[];
  collapsed?: boolean;
  showNewClientButton?: boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        { showNewClientButton && (
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
          </SidebarMenuItem>
        </SidebarMenu>
        )}
        <SidebarMenu>
          {items && items.length > 0 && items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} className="hover:bg-gray-100 active:bg-gray-400 active:text-white duration-200 ease-linear">
                <Link href={item.url} className="flex items-center gap-2 w-full">
                  {item.icon && <item.icon />}
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
