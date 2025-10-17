"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Car,
  Users,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  Home,
  UserCheck,
  Building,
  Globe,
  ChevronRight,
} from "lucide-react"
import { LogoAdmin } from "@/components/ui/logo"

import { useAuth } from "@/lib/auth/context"
import { Permission } from "@/types/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { NavUser } from "@/components/nav-user"

interface NavigationItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  isActive?: boolean
  permission?: Permission
  items?: {
    title: string
    url: string
    permission?: Permission
  }[]
}

export function GeorgiaSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, hasPermission } = useAuth()

  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Home,
      isActive: pathname === "/admin",
    },
    {
      title: "Inventory",
      url: "/admin/vehicles",
      icon: Car,
      permission: "view_vehicles",
      isActive: pathname.startsWith("/admin/vehicles"),
      items: [
        {
          title: "All Vehicles",
          url: "/admin/vehicles",
          permission: "view_vehicles",
        },
        {
          title: "Add Vehicle",
          url: "/admin/vehicles/new",
          permission: "create_vehicles",
        },
        {
          title: "Import from Auction",
          url: "/admin/vehicles/import",
          permission: "create_vehicles",
        },
      ],
    },
    {
      title: "Customers",
      url: "/admin/customers",
      icon: Users,
      permission: "view_customers",
      isActive: pathname.startsWith("/admin/customers"),
      items: [
        {
          title: "All Customers",
          url: "/admin/customers",
          permission: "view_customers",
        },
        {
          title: "Add Customer",
          url: "/admin/customers/new",
          permission: "manage_customers",
        },
      ],
    },
    {
      title: "Inquiries",
      url: "/admin/inquiries",
      icon: MessageSquare,
      permission: "view_inquiries",
      isActive: pathname.startsWith("/admin/inquiries"),
      items: [
        {
          title: "All Inquiries",
          url: "/admin/inquiries",
          permission: "view_inquiries",
        },
        {
          title: "My Inquiries",
          url: "/admin/inquiries?assigned_to=me",
          permission: "view_inquiries",
        },
        {
          title: "Urgent",
          url: "/admin/inquiries?priority=urgent",
          permission: "view_inquiries",
        },
      ],
    },
    {
      title: "Finance",
      url: "/admin/finance",
      icon: DollarSign,
      permission: "view_finances",
      isActive: pathname.startsWith("/admin/invoices") || pathname.startsWith("/admin/expenses") || pathname.startsWith("/admin/payments"),
      items: [
        {
          title: "Invoices",
          url: "/admin/invoices",
          permission: "view_finances",
        },
        {
          title: "Payments",
          url: "/admin/payments",
          permission: "view_finances",
        },
        {
          title: "Expenses",
          url: "/admin/expenses",
          permission: "view_finances",
        },
        {
          title: "Financial Reports",
          url: "/admin/reports/financial",
          permission: "view_finances",
        },
      ],
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: BarChart3,
      permission: "view_reports",
      isActive: pathname.startsWith("/admin/reports"),
      items: [
        {
          title: "Sales Report",
          url: "/admin/reports/sales",
          permission: "view_reports",
        },
        {
          title: "Inventory Report",
          url: "/admin/reports/inventory",
          permission: "view_reports",
        },
        {
          title: "Customer Report",
          url: "/admin/reports/customers",
          permission: "view_reports",
        },
        {
          title: "Expense Report",
          url: "/admin/reports/expenses",
          permission: "view_reports",
        },
      ],
    },
  ]

  const managementItems: NavigationItem[] = [
    {
      title: "User Management",
      url: "/admin/users",
      icon: UserCheck,
      permission: "manage_users",
      isActive: pathname.startsWith("/admin/users"),
    },
    {
      title: "Company Settings",
      url: "/admin/settings/company",
      icon: Building,
      permission: "manage_settings",
      isActive: pathname.startsWith("/admin/settings"),
      items: [
        {
          title: "Company Profile",
          url: "/admin/settings/company",
          permission: "manage_settings",
        },
        {
          title: "VAT Settings",
          url: "/admin/settings/vat",
          permission: "manage_settings",
        },
        {
          title: "Email Templates",
          url: "/admin/settings/emails",
          permission: "manage_settings",
        },
      ],
    },
    {
      title: "System Settings",
      url: "/admin/settings/system",
      icon: Settings,
      permission: "manage_settings",
      isActive: pathname.startsWith("/admin/settings/system"),
    },
  ]

  const quickAccessItems: NavigationItem[] = [
    {
      title: "Public Website",
      url: "/",
      icon: Globe,
    },
  ]

  const filterByPermission = (items: NavigationItem[]) => {
    return items.filter(item => {
      if (item.permission && !hasPermission(item.permission)) {
        return false
      }
      return true
    }).map(item => ({
      ...item,
      items: item.items?.filter(subItem => {
        if (subItem.permission && !hasPermission(subItem.permission)) {
          return false
        }
        return true
      })
    }))
  }

  const filteredNavigationItems = filterByPermission(navigationItems)
  const filteredManagementItems = filterByPermission(managementItems)
  const filteredQuickAccessItems = filterByPermission(quickAccessItems)

  const renderNavGroup = (items: NavigationItem[], label: string) => {
    if (items.length === 0) return null

    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            if (item.items && item.items.length > 0) {
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={item.isActive}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <LogoAdmin />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-xs text-sidebar-foreground/70"></span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {renderNavGroup(filteredNavigationItems, "Main")}
        {renderNavGroup(filteredManagementItems, "Management")}
        {renderNavGroup(filteredQuickAccessItems, "Quick Access")}
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={{
          name: user.full_name || "User",
          email: user.email || "",
          avatar: ""
        }} />
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}