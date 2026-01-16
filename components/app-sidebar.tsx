"use client";

import * as React from "react";
import Link from "next/link";
import { IconX } from "@tabler/icons-react";
import Image from "next/image";
import {
  IconCamera,
  IconChartBar,
  IconHome,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUser,
  IconUsers,
  IconHistory,
  IconBrandWhatsapp,
  IconMessage,
  IconReceipt,
  IconAlertCircle,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { useSidebarCollapse } from "@/components/ui/sidebar-collapse-context";
import { SidebarUser } from "@/types/user";

// Mapeamento de nomes de ícones para componentes
const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  IconCamera,
  IconChartBar,
  IconHome,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUser,
  IconUsers,
  IconHistory,
  IconBrandWhatsapp,
  IconMessage,
  IconReceipt,
  IconAlertCircle,
};

// Interface para os itens do menu
interface MenuItem {
  title: string;
  url: string;
  icon?: string; // Nome do ícone como string
}

// Interface para documentos
interface DocumentItem {
  name: string;
  url: string;
  icon: string; // Nome do ícone como string
}

// Props do AppSidebar
interface AppSidebarProps {
  user: SidebarUser;
  navMain: MenuItem[];
  navSecondary?: MenuItem[];
  documents?: DocumentItem[];
  homeUrl?: string;
  showNewClientButton?: boolean;
}

export function AppSidebar({
  user,
  navMain,
  navSecondary,
  documents,
  homeUrl = "/manager",
  showNewClientButton = false,
  ...props
}: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();
  const { collapsed, setCollapsed } = useSidebarCollapse();

  // Função para mapear nomes de ícones para componentes
  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || IconDashboard;
  };

  // Mapear os dados para incluir os componentes de ícones
  const mappedNavMain = navMain.map(item => ({
    ...item,
    icon: item.icon ? getIconComponent(item.icon) : undefined
  }));

  const mappedNavSecondary = navSecondary?.map(item => ({
    ...item,
    icon: item.icon ? getIconComponent(item.icon) : getIconComponent("IconSettings")
  }));

  const mappedDocuments = documents?.map(item => ({
    ...item,
    icon: getIconComponent(item.icon)
  }));

  return (
    <div className="relative flex h-full">
      <Sidebar
        collapsible="offcanvas"
        className={`${collapsed ? "w-16" : "w-72"} bg-white shadow-lg z-30`}
        {...props}
      >
        {/* Botão de fechar no mobile, canto superior direito, ícone X */}
        <button
          className="absolute top-2 right-4 sm:hidden z-50 bg-white rounded-full p-2 shadow"
          onClick={() => setOpenMobile(false)}
          aria-label="Fechar menu"
          type="button"
        >
          <IconX size={22} />
        </button>
        
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <Link href={homeUrl} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <Image 
                      src="/database.png"
                      alt="Data Ingestion Tool"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                  </div>
                  {!collapsed && (
                    <div className="flex flex-col">
                      <span className="text-base font-extrabold text-gray-900 leading-tight">
                        Data Ingestion <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Tool</span>
                      </span>
                      <span className="text-[10px] text-gray-500 -mt-0.5">Data Processing Platform</span>
                    </div>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent>
          <NavMain items={mappedNavMain} collapsed={collapsed} showNewClientButton = {showNewClientButton}/>
          {mappedDocuments && <NavDocuments items={mappedDocuments} collapsed={collapsed} />}
          {mappedNavSecondary && (
            <NavSecondary
              items={mappedNavSecondary}
              className="mt-auto"
              collapsed={collapsed}
            />
          )}
        </SidebarContent>
        
        <SidebarFooter>
          <NavUser homeUrl={homeUrl} user={user} collapsed={collapsed} />
        </SidebarFooter>
      </Sidebar>
      
      {/* Linha vertical fixa com botão de colapso/expandir */}
      <div
        className="fixed top-0 left-[calc(4rem-1px)] md:left-[calc(18rem-1px)] h-screen flex-col items-center z-30 pointer-events-none hidden sm:flex"
        style={{ left: collapsed ? "63px" : "287px" }}
      >
        <div className="w-px h-full bg-gray-200" />
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          className="absolute top-1/2 -translate-y-1/2 right-0 z-10 bg-white border border-gray-200 rounded-full shadow p-1 hover:bg-gray-100 transition-colors pointer-events-auto"
          style={{ transform: "translateY(-50%) translateX(50%)" }}
        >
          {collapsed ? (
            <span className="text-lg">&gt;&gt;</span>
          ) : (
            <span className="text-lg">&lt;&lt;</span>
          )}
        </button>
      </div>
    </div>
  );
}
