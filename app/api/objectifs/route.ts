// app/api/objectifs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";
import { getSession } from "@/lib/auth";

const the_resource = "objectif";

// GET - Récupérer tous les objectifs de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    if (!entrepriseId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    // Extraire les paramètres de pagination et de recherche
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    // Calculer l'offset
    const offset = (page - 1) * limit;

    // Construire le filtre de recherche
    const searchYear = parseInt(search);
    const whereClause: any = {
      AND: [
        { parc: { entrepriseId } },
        { site: { entrepriseId } },
        ...(search
          ? [
              {
                OR: [
                  { parc: { name: { contains: search, mode: "insensitive" } } },
                  { site: { name: { contains: search, mode: "insensitive" } } },
                  ...(isNaN(searchYear)
                    ? []
                    : [{ annee: { equals: searchYear } }]),
                ],
              },
            ]
          : []),
      ],
    };

    // Récupérer le total des objectifs pour la pagination
    const total = await prisma.objectif.count({
      where: whereClause,
    });

    // Récupérer les objectifs paginés
    const objectifs = await prisma.objectif.findMany({
      where: whereClause,
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
      orderBy: [
        { annee: "desc" },
        { parc: { name: "asc" } },
        { site: { name: "asc" } },
      ],
      skip: offset,
      take: limit,
    });

    // Calculer les informations de pagination
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return NextResponse.json({
      data: objectifs,
      pagination,
    });
  } catch (error) {
    console.error("Erreur GET /api/objectifs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des objectifs" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel objectif
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

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

    // Validation des champs requis
    if (!annee || !parcId || !siteId) {
      return NextResponse.json(
        { message: "L'année, le parc et le site sont requis" },
        { status: 400 }
      );
    }

    // Validation de l'année
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

    // Validation des valeurs numériques
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

    try {
      // Validation Dispo (0-100)
      const dispoValue = validateNumericValue(dispo, "Disponibilité", 0, 100);

      // Validation TDM (0-100)
      const tdmValue = validateNumericValue(tdm, "TDM", 0, 100);

      // Validation MTBF (>= 0)
      const mtbfValue = validateNumericValue(mtbf, "MTBF", 0);

      // Validation Spécifications (>= 0)
      const spe_huileValue = validateNumericValue(
        spe_huile,
        "Spécification Huile",
        0
      );
      const spe_goValue = validateNumericValue(spe_go, "Spécification GO", 0);
      const spe_graisseValue = validateNumericValue(
        spe_graisse,
        "Spécification Graisse",
        0
      );

      // Vérifier que le parc appartient à l'entreprise
      const parc = await prisma.parc.findFirst({
        where: {
          id: parcId,
          entrepriseId,
        },
      });

      if (!parc) {
        return NextResponse.json(
          { message: "Parc non trouvé ou n'appartient pas à votre entreprise" },
          { status: 404 }
        );
      }

      // Vérifier que le site appartient à l'entreprise
      const site = await prisma.site.findFirst({
        where: {
          id: siteId,
          entrepriseId,
        },
      });

      if (!site) {
        return NextResponse.json(
          { message: "Site non trouvé ou n'appartient pas à votre entreprise" },
          { status: 404 }
        );
      }

      // Vérifier l'unicité (annee, parcId, siteId)
      const existing = await prisma.objectif.findFirst({
        where: {
          annee: parseInt(annee),
          parcId,
          siteId,
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            message:
              "Un objectif existe déjà pour cette année, ce parc et ce site",
          },
          { status: 409 }
        );
      }

      // Créer l'objectif
      const objectif = await prisma.objectif.create({
        data: {
          annee: anneeInt,
          parcId,
          siteId,
          dispo: dispoValue,
          mtbf: mtbfValue,
          tdm: tdmValue,
          spe_huile: spe_huileValue,
          spe_go: spe_goValue,
          spe_graisse: spe_graisseValue,
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

      return NextResponse.json(objectif, { status: 201 });
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
  } catch (error: any) {
    console.error("Erreur POST /api/objectifs:", error);

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
      { message: "Erreur lors de la création de l'objectif" },
      { status: 500 }
    );
  }
}
