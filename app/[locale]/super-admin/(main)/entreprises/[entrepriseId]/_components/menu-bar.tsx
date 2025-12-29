// components/navbar/server-navbar.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Building2, Users, Settings } from "lucide-react";

const EntreprisePageInfoMenubar = async () => {
  const navigationItems = [
    { href: "#", label: "Dashboard", icon: Home },
    { href: "#", label: "Entreprises", icon: Building2 },
    { href: "#", label: "Utilisateurs", icon: Users },
    { href: "#", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="flex flex-wrap justify-center items-center gap-1 ">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            className="gap-2"
            asChild
          >
            <Link href={item.href}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
};

export default EntreprisePageInfoMenubar;
