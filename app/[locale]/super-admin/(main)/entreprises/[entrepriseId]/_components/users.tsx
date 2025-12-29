import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { Crown, Mail, User, Users } from "lucide-react";
import React from "react";

const EntreprisePageUsersList = ({ users }: { users: any }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Les utilisateurs de cette entreprise
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.slice(0, 3).map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.isOwner && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                    >
                      <Crown className="mr-1 h-3 w-3" />
                      Propriétaire
                    </Badge>
                  )}
                  <Badge variant={user.active ? "default" : "secondary"}>
                    {user.active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EntreprisePageUsersList;
