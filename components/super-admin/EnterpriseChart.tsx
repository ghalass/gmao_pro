import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface EnterpriseChartProps {
  entreprisesStats: Array<{
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    _count: {
      users: number;
      sites: number;
      engins: number;
    };
  }>;
}

export const EnterpriseChart: React.FC<EnterpriseChartProps> = ({
  entreprisesStats,
}) => {
  const maxUsers = Math.max(...entreprisesStats.map((e) => e._count.users), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Top Entreprises par Utilisateurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entreprisesStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune entreprise trouvée
            </p>
          ) : (
            entreprisesStats.slice(0, 5).map((entreprise) => (
              <div key={entreprise.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate max-w-36">
                      {entreprise.name}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        entreprise.active ? "bg-green-500" : "bg-red-500"
                      }`}
                      title={entreprise.active ? "Actif" : "Inactif"}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {entreprise._count.users} utilisateurs
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(entreprise._count.users / maxUsers) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{entreprise._count.sites} sites</span>
                  <span>{entreprise._count.engins} engins</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
