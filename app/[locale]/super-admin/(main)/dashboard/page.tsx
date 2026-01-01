import { API, apiFetch } from "@/lib/api";
import { StatsCard } from "@/components/super-admin/StatsCard";
import { RecentActivity } from "@/components/super-admin/RecentActivity";
import { EnterpriseChart } from "@/components/super-admin/EnterpriseChart";
import {
  Building2,
  Users,
  MapPin,
  Cog,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SuperAdminDashboardPage = async () => {
  const statsResponse = await apiFetch(API.SUPER_ADMIN.DASHBOARD_STATS);

  if (!statsResponse.ok) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Tableau de bord Super-Admin
          </h1>
          <p className="text-muted-foreground">
            Erreur lors du chargement des statistiques
          </p>
        </div>
      </div>
    );
  }

  const stats = statsResponse.data;

  return (
    <div className="bg-background">
      <div className="container mx-auto p-2 md:p-3 lg:p-4">
        {/* En-tête */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                Tableau de bord Super-Admin
              </h1>
              <p className="text-muted-foreground">
                Vue d'ensemble de toutes les entreprises
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/super-admin/entreprises">
                  Gérer les entreprises
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/super-admin/users">Gérer les utilisateurs</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Cartes de statistiques */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Entreprises"
            value={stats.overview.totalEntreprises}
            icon={Building2}
            description="Entreprises enregistrées"
            trend={{
              value: 12,
              isPositive: true,
            }}
          />
          <StatsCard
            title="Total Utilisateurs"
            value={stats.overview.totalUsers}
            icon={Users}
            description="Utilisateurs actifs"
            trend={{
              value: 8,
              isPositive: true,
            }}
          />
          <StatsCard
            title="Total Sites"
            value={stats.overview.totalSites}
            icon={MapPin}
            description="Sites opérationnels"
          />
          <StatsCard
            title="Total Engins"
            value={stats.overview.totalEngins}
            icon={Cog}
            description="Engins en service"
          />
        </section>

        {/* Statistiques détaillées */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <EnterpriseChart entreprisesStats={stats.entreprisesStats} />
          </div>
          <div className="space-y-4">
            <StatsCard
              title="Entreprises Actives"
              value={stats.overview.activeEntreprises}
              icon={Building2}
              description={`${
                stats.overview.totalEntreprises -
                stats.overview.activeEntreprises
              } inactives`}
            />
            <StatsCard
              title="Utilisateurs Actifs"
              value={stats.overview.activeUsers}
              icon={UserCheck}
              description={`${
                stats.overview.totalUsers - stats.overview.activeUsers
              } inactifs`}
            />
            <StatsCard
              title="Croissance (30j)"
              value={stats.overview.recentEntreprises}
              icon={TrendingUp}
              description="Nouvelles entreprises"
            />
          </div>
        </section>

        {/* Activité récente */}
        <section>
          <RecentActivity activities={stats.recentActivity} />
        </section>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
