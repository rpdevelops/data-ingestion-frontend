"use client";
import { createContext, useContext, useState } from "react";

const SidebarCollapseContext = createContext<{
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}>({
  collapsed: false,
  setCollapsed: () => {},
});

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarCollapseContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse() {
  return useContext(SidebarCollapseContext);
}
