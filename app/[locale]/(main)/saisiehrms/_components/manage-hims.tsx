"use client";

import { API, apiFetch } from "@/lib/api";
import {
  Saisiehrm,
  Saisiehim,
  Panne,
  Engin,
} from "@/lib/generated/prisma/client";
import { Activity, Edit, Trash2, Plus, Clock, Hash } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import EditSaisiehim from "./edit-saisiehim";
import DeleteSaisiehim from "./delete-saisiehim";
import AddSaisiehim from "./add-saisiehim";

interface ManageHimsProps {
  saisiehrm: Saisiehrm & { engin: Engin };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageHims = ({ saisiehrm, open, onOpenChange }: ManageHimsProps) => {
  const [hims, setHims] = useState<
    (Saisiehim & { panne: Panne; saisiehrm: Saisiehrm })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedHim, setSelectedHim] = useState<
    (Saisiehim & { panne: Panne; saisiehrm: Saisiehrm }) | null
  >(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const fetchHims = useCallback(async () => {
    try {
      setLoading(true);
      // We could have an endpoint for HIMs of an HRM, but for now we filter all HIMs or fetch detail
      // Better: we can fetch SAISIEHRMS.DETAILS(id) if it includes HIMs.
      // Let's check if our SAISIEHRMS.DETAILS endpoint includes HIMs.
      // Looking at app/api/saisiehrms/[id]/route.ts, it doesn't include the 'saisiehim' array, only count.
      // Let's fetch THEM from api/saisiehims with a filter if supported or just add a filter.
      // Actually let's assume we can fetch them via a query param or unique route.
      // I'll use SAISIEHIMS.ALL and filter on client side for now, or update the route.
      const response = await apiFetch(API.SAISIEHIMS.ALL);
      if (response.ok) {
        setHims(
          response.data.filter((h: any) => h.saisiehrmId === saisiehrm.id)
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [saisiehrm.id]);

  useEffect(() => {
    if (open) {
      fetchHims();
    }
  }, [open, fetchHims]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Interventions (HIM) - {saisiehrm.engin.name}
            </DialogTitle>
            <DialogDescription>
              Le {new Date(saisiehrm.du).toLocaleDateString()} | HRM:{" "}
              {saisiehrm.hrm}h
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter HIM
            </Button>
          </div>

          <div className="flex-1 pr-4 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Spinner />
                <p className="text-sm text-muted-foreground">
                  Chargement des interventions...
                </p>
              </div>
            ) : hims.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">
                  Aucune intervention enregistrée
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {hims.map((him) => (
                  <div
                    key={him.id}
                    className="p-4 rounded-lg border bg-card flex flex-col gap-3 group hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">
                            {him.panne.name}
                          </h4>
                          <Badge variant="outline" className="text-[10px] h-4">
                            ID: {him.ni}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {him.obs || "Aucune observation"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setSelectedHim(him);
                            setShowEdit(true);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedHim(him);
                            setShowDelete(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          HIM:{" "}
                          <span className="text-foreground font-medium">
                            {him.him}h
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <span>
                          Interventions:{" "}
                          <span className="text-foreground font-medium">
                            {him.ni}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedHim && (
        <>
          <EditSaisiehim
            saisiehim={selectedHim}
            open={showEdit}
            onOpenChange={setShowEdit}
            onSuccess={fetchHims}
          />
          <DeleteSaisiehim
            saisiehim={selectedHim}
            open={showDelete}
            onOpenChange={setShowDelete}
            onSuccess={fetchHims}
          />
        </>
      )}

      <AddSaisiehim
        saisiehrm={saisiehrm}
        open={showAdd}
        onOpenChange={setShowAdd}
        onSuccess={fetchHims}
      />
    </>
  );
};

export default ManageHims;
