import { API, apiFetch } from "@/lib/api";
import EntreprisePageHeader from "./_components/header";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, XCircle } from "lucide-react";
import EntreprisePageInfo from "./_components/card-info";
import { EntrepriseProvider } from "@/providers/entreprise-context";
import EntreprisePageInfoMenubar from "./_components/menu-bar";

export default async function AuthLayout({
  params,
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ entrepriseId: string }>;
}) {
  const { entrepriseId } = await params;
  // Fetch des données
  const entrepriseResponse = await apiFetch(
    API.SUPER_ADMIN.GET_ONE_ENTREPRISE(entrepriseId)
  );
  if (!entrepriseResponse.ok) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Erreur de chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Impossible de charger les données de l&apos;entreprise</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/super-admin/entreprises">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  const entreprise = entrepriseResponse.data;
  const users = entreprise.users || [];
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <EntreprisePageHeader />
      <EntreprisePageInfo entreprise={entreprise} users={users} />
      <EntreprisePageInfoMenubar />
      <EntrepriseProvider entrepriseData={entreprise}>
        {children}
      </EntrepriseProvider>
    </div>
  );
}
