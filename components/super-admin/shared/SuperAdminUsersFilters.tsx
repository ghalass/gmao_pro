"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { EnterpriseSelector } from "@/components/super-admin/shared/EnterpriseSelector";

export default function SuperAdminUsersFilters({
  entreprises,
}: {
  entreprises: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [entrepriseId, setEntrepriseId] = useState(
    searchParams.get("entrepriseId") || ""
  );
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [active, setActive] = useState(searchParams.get("active") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (entrepriseId) params.set("entrepriseId", entrepriseId);
    if (role) params.set("role", role);
    if (active) params.set("active", active);
    router.push(`?${params.toString()}`);
  };

  return (
    <form
      className="grid grid-cols-1 md:grid-cols-4 gap-4"
      onSubmit={handleSubmit}
    >
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          name="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <EnterpriseSelector
        entreprises={entreprises}
        value={entrepriseId}
        onChange={setEntrepriseId}
        placeholder="Toutes les entreprises"
      />
      <select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
      >
        <option value="">Tous les rôles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
      <select
        name="active"
        value={active}
        onChange={(e) => setActive(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
      >
        <option value="">Tous les statuts</option>
        <option value="true">Actifs</option>
        <option value="false">Inactifs</option>
      </select>
      <Button type="submit" className="md:col-span-4">
        Appliquer les filtres
      </Button>
    </form>
  );
}
