import { API, apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  Globe,
  Calendar,
  Users,
  ArrowLeft,
  Clock,
  Mail,
  Crown,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { getInitials, getJoinedDate } from "@/lib/utils";
import EntreprisePageInfo from "./_components/card-info";
import EntreprisePageUsersList from "./_components/users";

const EntreprisePage = async ({
  params,
}: {
  params: Promise<{ entrepriseId: string }>;
}) => {
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
    <>
      {/* <div className="flex flex-col gap-2"> */}
      {/* Carte principale de l'entreprise */}
      {/* <EntreprisePageInfo entreprise={entreprise} users={users} /> */}

      {/* Les utilisateurs */}
      <EntreprisePageUsersList users={users} />
      {/* </div> */}
    </>
  );
};

export default EntreprisePage;
