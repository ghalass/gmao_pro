// Test API endpoint without RBAC to isolate the issue
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET - Test endpoint without RBAC protection
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API Test: Starting test endpoint");

    // Test session only
    const session = await getSession();
    console.log(
      "🔍 API Test: Session retrieved:",
      session?.name,
      "Company:",
      session?.entrepriseName
    );

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Test database query without RBAC
    console.log(
      "🔍 API Test: Querying organes for company:",
      session.entrepriseId
    );
    const startTime = Date.now();

    const organes = await prisma.organe.findMany({
      where: { entrepriseId: session.entrepriseId },
      include: {
        type_organe: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    const endTime = Date.now();
    console.log(
      `🔍 API Test: Query completed in ${endTime - startTime}ms, found ${
        organes.length
      } organes`
    );

    return NextResponse.json({
      success: true,
      data: organes,
      meta: {
        queryTime: `${endTime - startTime}ms`,
        count: organes.length,
        user: session.name,
        company: session.entrepriseName,
      },
    });
  } catch (error) {
    console.error("🔍 API Test: Error:", error);
    return NextResponse.json(
      {
        error: "Test endpoint error",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
