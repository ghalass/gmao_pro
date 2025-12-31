"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: "error" | "warning";
}

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  errors: number;
  warnings: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: any[];
  errors?: ImportError[];
  summary?: ImportSummary;
}

interface ExcelImportProps {
  resourceType: string;
  apiEndpoint: string;
  resourceName: string;
  resourceDescription: string;
  templateColumns: { name: string; required: boolean; description: string }[];
  onImportComplete?: (result: ImportResult) => void;
  className?: string;
}

export function ExcelImport({
  resourceType,
  apiEndpoint,
  resourceName,
  resourceDescription,
  templateColumns,
  onImportComplete,
  className,
}: ExcelImportProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Type de fichier non supporté. Utilisez .xlsx, .xls ou .csv");
      return;
    }

    setSelectedFile(file);
    setResult(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const importResult: ImportResult = await response.json();

      if (!response.ok) {
        throw new Error(importResult.message || "Erreur lors de l'importation");
      }

      setResult(importResult);

      if (importResult.success) {
        toast.success(importResult.message);
      } else {
        toast.error(importResult.message);
      }

      onImportComplete?.(importResult);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(errorMessage);
      setResult({
        success: false,
        message: errorMessage,
        summary: { total: 0, created: 0, updated: 0, errors: 1, warnings: 0 },
      });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resourceType}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Template téléchargé avec succès");
    } catch (error) {
      toast.error("Erreur lors du téléchargement du template");
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Importation des {resourceName}
          </CardTitle>
          <CardDescription className="text-xs">
            {resourceDescription}. Téléchargez le template pour connaître le
            format requis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Bouton de téléchargement du template */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-1 h-7 px-2 text-xs"
            >
              <Download className="h-3 w-3" />
              Template
            </Button>
          </div>

          {/* Zone de drag & drop compacte */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-md p-4 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? "border-primary bg-primary/10 dark:bg-primary/20 scale-[1.02]"
                : "border-border hover:border-muted-foreground/50 hover:bg-muted/30 dark:hover:bg-muted/20"
            } ${uploading ? "pointer-events-none opacity-50" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              className="hidden"
            />
            <FileText className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            {isDragOver ? (
              <p className="text-xs font-medium text-foreground">
                Déposez le fichier ici...
              </p>
            ) : (
              <div>
                <p className="text-xs font-medium mb-1 text-foreground">
                  Glissez-déposez un fichier Excel ici
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                  ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-muted-foreground/70">
                  .xlsx, .xls, .csv
                </p>
              </div>
            )}
          </div>

          {/* Fichier sélectionné */}
          {selectedFile && (
            <div className="flex items-center justify-between p-2 bg-muted/50 dark:bg-muted/30 rounded-md border">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="text-xs font-medium truncate text-foreground">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
                disabled={uploading}
                className="h-5 w-5 p-0 hover:bg-destructive/10"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Barre de progression */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Importation...</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          )}

          {/* Bouton d'importation */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading
              ? "Importation en cours..."
              : `Importer les ${resourceName}`}
          </Button>

          {/* Instructions du format compact */}
          <Card className="border border-dashed bg-muted/30 dark:bg-muted/20">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs">Format du fichier</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {templateColumns.map((column, index) => (
                  <div key={index} className="flex items-start gap-1">
                    <Badge
                      variant={column.required ? "destructive" : "secondary"}
                      className="text-xs h-4 px-1"
                    >
                      {column.name}
                      {column.required && "*"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {column.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Résultats de l'importation */}
          {result && result.summary && (
            <div className="space-y-2">
              {/* Résumé compact */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
                <div className="text-center p-1 border rounded bg-muted/30 dark:bg-muted/20">
                  <div className="text-sm font-bold text-foreground">
                    {result.summary.total}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-1 border rounded bg-muted/30 dark:bg-muted/20">
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    {result.summary.created}
                  </div>
                  <div className="text-xs text-muted-foreground">Créés</div>
                </div>
                <div className="text-center p-1 border rounded bg-muted/30 dark:bg-muted/20">
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {result.summary.updated}
                  </div>
                  <div className="text-xs text-muted-foreground">Màj</div>
                </div>
                <div className="text-center p-1 border rounded bg-muted/30 dark:bg-muted/20">
                  <div className="text-sm font-bold text-red-600 dark:text-red-400">
                    {result.summary.errors}
                  </div>
                  <div className="text-xs text-muted-foreground">Erreurs</div>
                </div>
                <div className="text-center p-1 border rounded bg-muted/30 dark:bg-muted/20">
                  <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    {result.summary.warnings}
                  </div>
                  <div className="text-xs text-muted-foreground">Avertis.</div>
                </div>
              </div>

              {/* Message de résultat */}
              <Alert
                className={
                  result.success
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
                }
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <AlertDescription className="text-sm text-foreground">
                    {result.message}
                  </AlertDescription>
                </div>
              </Alert>

              {/* Erreurs détaillées */}
              {result.errors && result.errors.length > 0 && (
                <Card className="border">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      Erreurs d'importation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className={`p-1 rounded border text-xs ${
                            error.severity === "error"
                              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                              : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-1">
                                <Badge
                                  variant={
                                    error.severity === "error"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs h-4 px-1"
                                >
                                  L{error.row}
                                </Badge>
                                <span className="text-xs font-medium text-foreground">
                                  {error.field}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {error.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
