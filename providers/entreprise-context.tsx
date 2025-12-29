// app/providers/entreprise-context.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";

const EntrepriseContext = createContext<any>(null);

export function EntrepriseProvider({
  children,
  entrepriseData,
}: {
  children: ReactNode;
  entrepriseData: any;
}) {
  return (
    <EntrepriseContext.Provider value={entrepriseData}>
      {children}
    </EntrepriseContext.Provider>
  );
}

export function useEntreprise() {
  const context = useContext(EntrepriseContext);
  if (!context) {
    throw new Error("useEntreprise must be used within EntrepriseProvider");
  }
  return context;
}
