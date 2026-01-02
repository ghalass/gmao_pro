import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Building2, UserPlus } from "lucide-react";

interface RecentActivityProps {
  activities: Array<{
    id: string;
    name: string;
    createdAt: string;
    users?: Array<{
      id: string;
      name: string;
      createdAt: string;
    }>;
  }>;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune activité récente
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Entreprise créée
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </Badge>
                  {activity.users && activity.users.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <UserPlus className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {activity.users[0].name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
