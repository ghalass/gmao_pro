import { useState, useEffect } from "react";
import { API, apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface EnginIndicators {
  disp: number;
  tdm: number;
  mtbf: number;
  hrm: number;
  him: number;
  ni: number;
  hrd: number;
  nho: number;
}

export interface EnginData {
  id: string;
  name: string;
  site: {
    id: string;
    name: string;
  };
  parc: {
    id: string;
    name: string;
    typeparc: {
      id: string;
      name: string;
    };
  };
  indicators: {
    day: EnginIndicators;
    month: EnginIndicators;
    year: EnginIndicators;
  };
  objectif: {
    dispo: number | null;
    tdm: number | null;
    mtbf: number | null;
  } | null;
}

export interface ParcData {
  parc: EnginData["parc"];
  engins: EnginData[];
  objectif: {
    dispo: number | null;
    tdm: number | null;
    mtbf: number | null;
  } | null;
}

export interface SiteData {
  site: EnginData["site"];
  parcs: Record<string, ParcData>;
}

export interface RapportRjeResponse {
  date: Date;
  sites: SiteData[];
  objectifs: {
    dispo: number;
    tdm: number;
    mtbf: number;
  };
  totalEngins: number;
}

export const useRapportRje = (date: Date | null) => {
  const [error, setError] = useState<string | null>(null);

  const {
    data: rapportData,
    isLoading,
    refetch,
  } = useQuery<RapportRjeResponse>({
    queryKey: ["rapport-rje", date?.toISOString()],
    queryFn: async () => {
      try {
        if (!date) {
          throw new Error("Aucune date sélectionnée");
        }

        setError(null);

        const dateParam = date.toISOString().split("T")[0];
        const response = await apiFetch(
          `${API.RAPPORTS_RJE.BASE}?date=${dateParam}`
        );

        if (response.ok) {
          return response.data as RapportRjeResponse;
        } else {
          const errorData = response.data?.message;
          console.error("Erreur rapport RJE:", errorData);
          throw new Error(errorData || "Erreur lors du chargement du rapport");
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement du rapport RJE:", err);
        setError(err.message || "Erreur lors du chargement du rapport");
        throw err;
      }
    },
    enabled: !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refresh = async () => {
    try {
      await refetch();
    } catch (err: any) {
      setError(err.message || "Erreur lors du rafraîchissement");
    }
  };

  return {
    rapportData,
    isLoading,
    error,
    refresh,
  };
};
