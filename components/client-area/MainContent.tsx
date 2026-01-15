"use client";
import { useSidebarCollapse } from "@/components/ui/sidebar-collapse-context";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarCollapse();
  return (
    <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-72"}`}>
      <SidebarInset className="">
        <SiteHeader />
        <div className="flex flex-1 px-2 flex-col">
          <div className="py-4 gap-4 md:py-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}
