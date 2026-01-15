"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { Menu } from "lucide-react"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 -ml-1"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 flex sm:hidden"
        />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DI</span>
          </div>
          <h1 className="text-base font-bold">
            Data Ingestion <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Tool</span>
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
        </div>
      </div>
    </header>
  )
}
