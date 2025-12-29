"use client";

import {
  Home,
  ChevronDown,
  Users,
  Shield,
  ShieldUser,
  LockKeyhole,
  FileUpIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { cn } from "@/lib/utils";

// Hook personnalisé pour la navigation active
import { usePathname } from "next/navigation";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";

function useActivePath() {
  const pathname = usePathname();

  return (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname === url;
  };
}

export function AppSidebar() {
  const tans = useScopedI18n("sidebar");

  // Menu items
  const mainItems = [
    {
      title: tans("dashboard.title"),
      url: "/dashboard",
      icon: Home,
      description: tans("dashboard.description"),
    },
  ];

  const adminItems = {
    title: "Administrateur",
    icon: LockKeyhole,

    list: [
      {
        title: "Utilisateurs",
        url: "/users",
        icon: Users,
        description: "Gérer les utilisateurs",
      },
      {
        title: "Rôles",
        url: "/roles",
        icon: Shield,
        description: "Gérer les rôles",
      },
      {
        title: "Permissions",
        url: "/permissions",
        icon: ShieldUser,
        description: "Gérer les permissions",
      },
      {
        title: "Importations",
        url: "/importations",
        icon: FileUpIcon,
        description: "Gérer les importations",
      },
    ],
  };

  const allItems = [adminItems];

  const isActivePath = useActivePath();
  const locale = useCurrentLocale();
  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      side={locale === "ar" ? "right" : "left"}
    >
      <SidebarContent className="py-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Liens principaux */}
              {mainItems.map((item) => {
                const isActive = isActivePath(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.description}
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-200 hover:bg-accent mb-1",
                        isActive &&
                          "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4 text-primary" />
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="ml-auto w-1 h-4 bg-primary rounded-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <hr className="my-1" />
              {/* ALL */}
              {allItems.map((theItem, index) => (
                <Collapsible
                  key={index}
                  className="group/collapsible"
                  defaultOpen={false}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className="w-full justify-between hover:bg-accent transition-all duration-200"
                        tooltip={theItem.title}
                      >
                        <div className="flex items-center gap-2">
                          <theItem.icon className="w-4 h-4" />
                          <span
                            className={cn(
                              "transition-all duration-200",
                              "group-data-[collapsible=icon]:hidden"
                            )}
                          >
                            {theItem.title}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 text-muted-foreground" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="CollapsibleContent">
                      <SidebarMenuSub className="mt-1">
                        <SidebarMenuSubItem>
                          {theItem.list.map((item) => {
                            const isActive = isActivePath(item.url);
                            return (
                              <SidebarMenuButton
                                key={item.title}
                                asChild
                                isActive={isActive}
                                className={cn(
                                  "pl-4 transition-all duration-200 hover:bg-accent mb-1",
                                  isActive &&
                                    "bg-accent text-accent-foreground font-medium"
                                )}
                                tooltip={item.description}
                              >
                                <Link href={item.url}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.title}</span>
                                  {isActive && (
                                    <div className="ml-auto w-1 h-3 bg-primary rounded-full" />
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            );
                          })}
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>

            {/*  */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
