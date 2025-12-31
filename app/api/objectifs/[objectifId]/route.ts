// app/api/objectifs/[objectifId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "objectif";

// GET - Récupérer un objectif spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ objectifId: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { objectifId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const objectif = await prisma.objectif.findFirst({
      where: {
        id: objectifId,
        AND: [
          { parc: { entrepriseId } },
          { site: { entrepriseId } },
        ],
      },
      include: {
        parc: {
          select: {
            id: true,
            name: true,
            typeparc: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        site: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!objectif) {
      return NextResponse.json(
        { message: "Objectif non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(objectif);
  } catch (error) {
    console.error("Error fetching objectif:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de l'objectif" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un objectif
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ objectifId: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { objectifId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      annee,
      parcId,
      siteId,
      dispo,
      mtbf,
      tdm,
      spe_huile,
      spe_go,
      spe_graisse,
    } = body;

    // Vérifier si l'objectif existe et appartient à l'entreprise
    const existingObjectif = await prisma.objectif.findFirst({
      where: {
        id: objectifId,
        AND: [
          { parc: { entrepriseId } },
          { site: { entrepriseId } },
        ],
      },
    });

    if (!existingObjectif) {
      return NextResponse.json(
        { message: "Objectif introuvable" },
        { status: 404 }
      );
    }

    // Validation: au moins un champ à mettre à jour
    if (
      annee === undefined &&
      parcId === undefined &&
      siteId === undefined &&
      dispo === undefined &&
      mtbf === undefined &&
      tdm === undefined &&
      spe_huile === undefined &&
      spe_go === undefined &&
      spe_graisse === undefined
    ) {
      return NextResponse.json(
        { message: "Au moins un champ à mettre à jour est requis" },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    // Validation de l'année si modifiée
    if (annee !== undefined) {
      const anneeInt = parseInt(annee);
      if (isNaN(anneeInt)) {
        return NextResponse.json(
          { message: "L'année doit être un nombre valide" },
          { status: 400 }
        );
      }
      if (anneeInt < 1900 || anneeInt > 2100) {
        return NextResponse.json(
          { message: "L'année doit être entre 1900 et 2100" },
          { status: 400 }
        );
      }
      const anneeStr = anneeInt.toString();
      if (anneeStr.length !== 4 || !/^\d{4}$/.test(anneeStr)) {
        return NextResponse.json(
          { message: "L'année doit être composée de 4 chiffres" },
          { status: 400 }
        );
      }
      updateData.annee = anneeInt;
    }

    if (parcId !== undefined) {
      // Vérifier que le parc appartient à l'entreprise
      const parc = await prisma.parc.findFirst({
        where: {
          id: parcId,
          entrepriseId,
        },
      });

      if (!parc) {
        return NextResponse.json(
          {
            message:
              "Parc non trouvé ou n'appartient pas à votre entreprise",
          },
          { status: 404 }
        );
      }

      updateData.parcId = parcId;
    }

    if (siteId !== undefined) {
      // Vérifier que le site appartient à l'entreprise
      const site = await prisma.site.findFirst({
        where: {
          id: siteId,
          entrepriseId,
        },
      });

      if (!site) {
        return NextResponse.json(
          {
            message:
              "Site non trouvé ou n'appartient pas à votre entreprise",
          },
          { status: 404 }
        );
      }

      updateData.siteId = siteId;
    }

    // Fonction de validation des valeurs numériques
    const validateNumericValue = (
      value: any,
      fieldName: string,
      min: number,
      max?: number
    ): number | null => {
      if (value === undefined || value === null || value === "") {
        return null;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        throw new Error(`${fieldName} doit être un nombre valide`);
      }
      if (numValue < min) {
        throw new Error(`${fieldName} doit être >= ${min}`);
      }
      if (max !== undefined && numValue > max) {
        throw new Error(`${fieldName} doit être <= ${max}`);
      }
      return numValue;
    };

    // Gérer les valeurs numériques optionnelles avec validation
    try {
      if (dispo !== undefined) {
        updateData.dispo = validateNumericValue(dispo, "Disponibilité", 0, 100);
      }
      if (mtbf !== undefined) {
        updateData.mtbf = validateNumericValue(mtbf, "MTBF", 0);
      }
      if (tdm !== undefined) {
        updateData.tdm = validateNumericValue(tdm, "TDM", 0, 100);
      }
      if (spe_huile !== undefined) {
        updateData.spe_huile = validateNumericValue(
          spe_huile,
          "Spécification Huile",
          0
        );
      }
      if (spe_go !== undefined) {
        updateData.spe_go = validateNumericValue(spe_go, "Spécification GO", 0);
      }
      if (spe_graisse !== undefined) {
        updateData.spe_graisse = validateNumericValue(
          spe_graisse,
          "Spécification Graisse",
          0
        );
      }
    } catch (validationError: any) {
      // Gérer les erreurs de validation
      if (validationError.message) {
        return NextResponse.json(
          { message: validationError.message },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Vérifier l'unicité si annee, parcId ou siteId sont modifiés
    if (annee !== undefined || parcId !== undefined || siteId !== undefined) {
      const finalAnnee = annee !== undefined ? parseInt(annee) : existingObjectif.annee;
      const finalParcId = parcId !== undefined ? parcId : existingObjectif.parcId;
      const finalSiteId = siteId !== undefined ? siteId : existingObjectif.siteId;

      const duplicate = await prisma.objectif.findFirst({
        where: {
          annee: finalAnnee,
          parcId: finalParcId,
          siteId: finalSiteId,
          id: { not: objectifId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            message:
              "Un objectif existe déjà pour cette combinaison année/parc/site",
          },
          { status: 409 }
        );
      }
    }

    // Mettre à jour l'objectif
    const objectif = await prisma.objectif.update({
      where: { id: objectifId },
      data: updateData,
      include: {
        parc: {
          select: {
            id: true,
            name: true,
            typeparc: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        site: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(objectif);
  } catch (error: any) {
    console.error("Erreur PATCH /api/objectifs/[id]:", error);

    // Gérer les erreurs Prisma spécifiques
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          message:
            "Un objectif existe déjà pour cette combinaison année/parc/site",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Erreur lors de la mise à jour de l'objectif",
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un objectif
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ objectifId: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { objectifId } = await context.params;
    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'objectif existe et appartient à l'entreprise
    const existingObjectif = await prisma.objectif.findFirst({
      where: {
        id: objectifId,
        AND: [
          { parc: { entrepriseId } },
          { site: { entrepriseId } },
        ],
      },
    });

    if (!existingObjectif) {
      return NextResponse.json(
        { message: "Objectif introuvable" },
        { status: 404 }
      );
    }

    // Supprimer l'objectif
    await prisma.objectif.delete({
      where: { id: objectifId },
    });

    return NextResponse.json({
      message: "Objectif supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/objectifs/[id]:", error);

    return NextResponse.json(
      {
        message: "Erreur lors de la suppression de l'objectif",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

