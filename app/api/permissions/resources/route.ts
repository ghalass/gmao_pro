import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "permission";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    // Direct query using regex to exclude tables starting with _
    // !~ '^_' means "does not match the regex starts with _"
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name !~ '^_'
      ORDER BY table_name ASC
    `;

    console.log("Raw tables found:", tables);

    // Map to array of strings, handle potential property name casing
    const resources = tables.map(
      (t) => t.table_name || t.TABLE_NAME || t.TableName
    );

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Erreur GET /api/permissions/resources:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tables" },
      { status: 500 }
    );
  }
}
