"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, Upload, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface RoleImportProps {
  onImportComplete: (result: any) => void;
}

export function RoleImport({ onImportComplete }: RoleImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Type de fichier non supporté. Utilisez .xlsx, .xls ou .csv");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch("/api/roles/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || "Erreur lors de l'importation");
      }

      const result = await response.json();
      onImportComplete(result);

      toast.success("Importation terminée avec succès");
      setFile(null);
      setProgress(0);
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Erreur lors de l'importation");
      toast.error(err.message || "Erreur lors de l'importation");
    } finally {
      setUploading(false);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress(0);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/roles/import");

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du template");
      }

      // Create blob from response
      const blob = new Blob([await response.blob()], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "roles_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Template téléchargé avec succès");
    } catch (err: any) {
      console.error("Template download error:", err);
      toast.error("Erreur lors du téléchargement du template");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Importation de rôles</h3>
          <p className="text-sm text-muted-foreground">
            Importez des rôles en masse depuis un fichier Excel
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Télécharger le template
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Instructions :</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Téléchargez le template Excel ci-dessus</li>
            <li>Remplissez les colonnes obligatoires (marquées d'un *)</li>
            <li>Les champs optionnels peuvent être laissés vides</li>
            <li>Importez le fichier complété</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Sélectionner un fichier Excel</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mt-1"
              disabled={uploading}
            />
          </div>

          {file && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Fichier sélectionné :
                </span>
                <span className="font-medium truncate max-w-50">
                  {file.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taille :</span>
                <span className="font-medium">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importation en cours...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importation...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importer les rôles
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
