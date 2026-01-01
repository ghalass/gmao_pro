"use client";

import { API, apiFetch } from "@/lib/api";
import { ROUTE } from "@/lib/routes";
import { getJoinedDate } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Globe,
  Calendar,
  Clock,
  ChevronRight,
  Users,
  Plus,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { NewEntrepriseDialog } from "./_components/new-entreprise";
import { EditEntrepriseDialog } from "./_components/edit-entreprise";
import { DeleteEntrepriseDialog } from "./_components/delete-entreprise";
import { EntrepriseActions } from "./_components/entreprise-actions";

interface EntrepriseData {
  id: string;
  name: string;
  lang: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    sites: number;
    engins: number;
  };
}

const EntreprisesPage = () => {
  const [entreprises, setEntreprises] = useState<EntrepriseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Dialog states
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] =
    useState<EntrepriseData | null>(null);

  const fetchEntreprises = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch(API.SUPER_ADMIN.GET_ALL_ENTREPRISES);

      if (response.ok) {
        setEntreprises(response.data || []);
      } else {
        setError("Erreur lors du chargement des entreprises");
      }
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntreprises();
  }, []);

  const handleCreateSuccess = () => {
    fetchEntreprises();
  };

  const handleEditSuccess = () => {
    fetchEntreprises();
    setSelectedEntreprise(null);
  };

  const handleDeleteSuccess = () => {
    fetchEntreprises();
    setSelectedEntreprise(null);
  };

  const handleViewDetails = (entreprise: EntrepriseData) => {
    // Navigation vers la page de détails
    window.location.href = ROUTE.SUPER_ADMIN.ENTREPRISE_DETAILS(entreprise.id);
  };

  const handleViewUsers = (entreprise: EntrepriseData) => {
    // Navigation vers la page des utilisateurs de l'entreprise
    window.location.href = `/super-admin/users?entrepriseId=${entreprise.id}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Chargement des entreprises...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchEntreprises} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto p-2 md:p-3 lg:p-4">
        {/* En-tête */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Gestion des Entreprises
              </h1>
              <p className="text-muted-foreground">
                {entreprises.length.toLocaleString()} entreprises chargées avec
                succès
              </p>
            </div>
            <Button onClick={() => setNewDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Entreprise
            </Button>
          </div>
        </header>

        {/* Contenu principal */}
        {entreprises.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune entreprise</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre première entreprise
            </p>
            <Button onClick={() => setNewDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une entreprise
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {entreprises.map((entreprise) => (
              <div
                key={entreprise.id}
                className="group p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-200 hover:border-primary/20"
              >
                <div className="flex items-center gap-3">
                  {/* Cercle avec numéro */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary font-bold">
                      {entreprises.indexOf(entreprise) + 1}
                    </span>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    {/* Titre et statut */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-base truncate group-hover:text-primary transition-colors">
                        {entreprise.name}
                      </h3>
                      <Badge
                        variant={entreprise.active ? "default" : "secondary"}
                        className={
                          entreprise.active
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "text-destructive"
                        }
                      >
                        {entreprise.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end mb-3">
                      <EntrepriseActions
                        entreprise={entreprise}
                        onView={handleViewDetails}
                        onEdit={(entreprise: EntrepriseData) => {
                          setSelectedEntreprise(entreprise);
                          setEditDialogOpen(true);
                        }}
                        onDelete={(entreprise: EntrepriseData) => {
                          setSelectedEntreprise(entreprise);
                          setDeleteDialogOpen(true);
                        }}
                        onViewUsers={handleViewUsers}
                      />
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {/* Date de création */}
                      <div className="flex items-center gap-1">
                        <span className="opacity-70">📅</span>
                        <span>
                          Créée le : {getJoinedDate(entreprise.createdAt)}
                        </span>
                      </div>

                      {/* Langue */}
                      <div className="flex items-center gap-1">
                        <span className="opacity-70">🌐</span>
                        <span className="font-medium">
                          Langue : {entreprise.lang.toUpperCase()}
                        </span>
                      </div>

                      {/* Statistiques */}
                      <div className="flex items-center gap-1">
                        <span className="opacity-70">👥</span>
                        <span>
                          {entreprise._count?.users || 0} utilisateurs
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="opacity-70">📍</span>
                        <span>{entreprise._count?.sites || 0} sites</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="opacity-70">⚙️</span>
                        <span>{entreprise._count?.engins || 0} engins</span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton flèche */}
                  <button className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors group-hover:translate-x-1 duration-200">
                    <span className="opacity-60 group-hover:opacity-100">
                      <Link
                        href={ROUTE.SUPER_ADMIN.ENTREPRISE_DETAILS(
                          entreprise.id
                        )}
                        className="text-xl font-semibold hover:text-primary transition-colors"
                      >
                        →
                      </Link>
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <NewEntrepriseDialog
          open={newDialogOpen}
          onOpenChange={setNewDialogOpen}
          onSuccess={handleCreateSuccess}
        />

        {selectedEntreprise && (
          <>
            <EditEntrepriseDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              entreprise={selectedEntreprise}
              onSuccess={handleEditSuccess}
            />
            <DeleteEntrepriseDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              entreprise={selectedEntreprise}
              onSuccess={handleDeleteSuccess}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EntreprisesPage;
