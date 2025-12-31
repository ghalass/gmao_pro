"use client";

import {
  Home,
  ChevronDown,
  Users,
  Shield,
  ShieldUser,
  LockKeyhole,
  FileUpIcon,
  Settings,
  Truck,
  Car,
  Tractor,
  MapPin,
  Wrench,
  ListOrdered,
  Keyboard,
  Gauge,
  KeyboardMusic,
  FolderCog2 as FolderCog2Icon,
  CalendarCheck,
  Ungroup,
  NotepadText,
  BookOpenCheck,
  Boxes,
  Puzzle,
  FormInput as FormInputIcon,
  Move,
  ClockCheck,
  Droplet,
  SoapDispenserDroplet,
  Target,
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
  const locale = useCurrentLocale();

  return (url: string) => {
    // Retirer le préfixe de la locale du chemin actuel pour la comparaison
    // Exemple: "/fr/users" -> "/users"
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

    if (url === "/") {
      return pathWithoutLocale === "/";
    }
    return pathWithoutLocale === url;
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
    ],
  };

  const configItems = {
    title: "Configurations",
    icon: Settings,

    list: [
      {
        title: "Engin",
        url: "/engins",
        icon: Truck,
        description: "Gérer les engins",
      },
      {
        title: "Parc",
        url: "/parcs",
        icon: Car,
        description: "Gérer les parcs",
      },
      {
        title: "Type de parc",
        url: "/typeparcs",
        icon: Tractor,
        description: "Gérer les type des parcs",
      },
      {
        title: "Sites",
        url: "/sites",
        icon: MapPin,
        description: "Gérer les sites",
      },
      {
        title: "Panne",
        url: "/pannes",
        icon: Wrench,
        description: "Gérer les pannes",
      },
      {
        title: "Type de panne",
        url: "/typepannes",
        icon: ListOrdered,
        description: "Gérer les type des pannes",
      },

      {
        title: "Lubrifiants",
        url: "/lubrifiants",
        icon: SoapDispenserDroplet,
        description: "Gérer les lubrifiants",
      },
      {
        title: "Type de lubrifiant",
        url: "/typelubrifiants",
        icon: Droplet,
        description: "Gérer les type des lubrifiant",
      },
      {
        title: "Type de consommation de lubrifiant",
        url: "/typeconsommationlubs",
        icon: Droplet,
        description: "Gérer les type des consommations de lubrifiant",
      },

      {
        title: "Type d'organe",
        url: "/typeorganes",
        icon: Puzzle,
        description: "Gérer les types d'organes",
      },
      {
        title: "Objectifs",
        url: "/objectifs",
        icon: Target,
        description: "Gérer les objectifs",
      },
    ],
  };

  const saisieItems = {
    title: "Gestion de saisie",
    icon: Settings,

    list: [
      {
        title: "Journalier",
        url: "/saisies",
        icon: Truck,
        description: "Gérer les saisies des engins",
      },
      {
        title: "Saisies hrm",
        url: "/saisiehrms",
        icon: Keyboard,
        description: "Tout les saisies hrm",
      },
    ],
  };

  const backlogItems = {
    title: "Gestion des backlog",
    icon: Wrench,
    list: [
      {
        title: "Dashboard",
        url: "/anomalies/stats",
        icon: Gauge,
        description: "Dashboard",
      },
      {
        title: "Backlog",
        url: "/anomalies",
        icon: Wrench,
        description: "Gestion des anomalies",
      },
      {
        title: "Saisie",
        url: "/anomalies/saisie",
        icon: KeyboardMusic,
        description: "Saisie des anomalies",
      },
    ],
  };

  const rapportsItems = {
    title: "Rapports",
    icon: FolderCog2Icon,

    list: [
      {
        title: "RJE",
        url: "/rapports/rje",
        icon: CalendarCheck,
        description: "RJE",
      },
      {
        title: "Unité physique",
        url: "/rapports/unite-physique",
        icon: Ungroup,
        description: "Unité physique",
      },
      {
        title: "Etat Mensuel",
        url: "/rapports/etat-mensuel",
        icon: NotepadText,
        description: "Etat Mensuel",
      },
      {
        title: "Analyse Indispo",
        url: "/rapports/analyse-indispo-parc",
        icon: BookOpenCheck,
        description: "analyse-indispo",
      },
      {
        title: "Etat Général",
        url: "/rapports/etat-general",
        icon: Boxes,
        description: "etat-general",
      },
      {
        title: "Paretos",
        url: "/rapports/pareto",
        icon: Boxes,
        description: "Paretos",
      },
    ],
  };

  const gestionOrganesItems = {
    title: "Gestion des organes",
    icon: Puzzle,
    list: [
      {
        title: "Organes",
        url: "/organes",
        icon: FormInputIcon,
        description: "Gestion des organes",
      },
      {
        title: "Mouvements",
        url: "/organes/rapports/mvt-organe",
        icon: Move,
        description: "Rapport mensuel des mouvements des organes",
      },
      {
        title: "HRM",
        url: "/organes/rapports/heure-marche",
        icon: ClockCheck,
        description: "Rapport mensuel des heures de marche des organes",
      },
    ],
  };

  const allItems = [
    adminItems,
    configItems,
    saisieItems,
    backlogItems,
    rapportsItems,
    gestionOrganesItems,
  ];

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
