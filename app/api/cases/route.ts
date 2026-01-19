/**
 * Cases API endpoint
 * Handles case listing, acceptance, and management
 */

import { NextResponse } from "next/server";
import { DEV_USER_ID } from "@/lib/constants";
import {
  getAvailableCases,
  getUserCases,
  acceptCase,
  abandonCase,
  getActiveCase,
} from "@/lib/cases";
import { seedAvailableCases, getStarterContent } from "@/lib/case-generator";
import { addMultipleEvidence } from "@/lib/evidence";

/**
 * GET /api/cases - Get available cases or user's active cases
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "available";

  try {
    if (type === "available") {
      let cases = await getAvailableCases();

      // If no cases available, seed the pool
      if (cases.length === 0) {
        await seedAvailableCases();
        cases = await getAvailableCases();
      }

      return NextResponse.json({ cases });
    }

    if (type === "active") {
      const { active, history } = await getUserCases(DEV_USER_ID);
      return NextResponse.json({ active, history });
    }

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Cases GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases - Accept, abandon, or seed cases
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, caseId } = body;

    if (action === "accept") {
      if (!caseId) {
        return NextResponse.json(
          { error: "caseId required" },
          { status: 400 }
        );
      }

      const acceptedCase = await acceptCase(DEV_USER_ID, caseId);
      return NextResponse.json({ case: acceptedCase });
    }

    if (action === "abandon") {
      if (!caseId) {
        return NextResponse.json(
          { error: "caseId required" },
          { status: 400 }
        );
      }

      const abandonedCase = await abandonCase(DEV_USER_ID, caseId);
      return NextResponse.json({ case: abandonedCase });
    }

    if (action === "seed") {
      // Seed cases and grant starter evidence to user
      await seedAvailableCases();
      const { evidence } = getStarterContent();
      await addMultipleEvidence(DEV_USER_ID, evidence);

      return NextResponse.json({ success: true, seeded: true });
    }

    if (action === "get_active") {
      if (!caseId) {
        return NextResponse.json(
          { error: "caseId required" },
          { status: 400 }
        );
      }

      const activeCase = await getActiveCase(DEV_USER_ID, caseId);
      if (!activeCase) {
        return NextResponse.json(
          { error: "Case not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ case: activeCase });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Cases POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
