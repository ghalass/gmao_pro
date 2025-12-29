import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const EntreprisePageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/super-admin/entreprises">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Détails de l&apos;entreprise
          </h1>
          <p className="text-muted-foreground">
            Gérez et visualisez toutes les informations de l&apos;entreprise
          </p>
        </div>
      </div>
    </div>
  );
};

export default EntreprisePageHeader;
