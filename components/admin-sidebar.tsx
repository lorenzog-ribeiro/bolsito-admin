"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileBarChart2,
  ChevronRight,
  LogOut,
  Shield,
  Calculator,
  Trophy,
  Database,
  Image,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Visao Geral",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Simuladores",
    href: "/simuladores",
    icon: Calculator,
  },
  {
    title: "Rankings",
    href: "/rankings",
    icon: Trophy,
  },
  {
    title: "Simulacoes",
    href: "/simulacoes",
    icon: Database,
  },
  {
    title: "Assets",
    href: "/assets",
    icon: Image,
  },
  {
    title: "Permissoes",
    href: "/permissoes",
    icon: Shield,
    adminOnly: true,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const isAdmin = user?.isStaff === true || user?.isSuperuser === true

  const visibleNavItems = navItems.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || isAdmin
  ) as typeof navItems

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-row items-center border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary">
            <FileBarChart2 className="size-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Painel administrativo
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegacao</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto size-3 opacity-50" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Sair"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
