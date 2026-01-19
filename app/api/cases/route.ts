/**
 * Cases API endpoint
 * Handles case listing, acceptance, and management
 */

import { NextResponse } from "next/server";
import { DEV_USER_ID } from "@/lib/constants";
import {
  getAvailableCases,
  getAvailableCase,
  getUserCases,
  acceptCase,
  abandonCase,
  getActiveCase,
  completeCase,
  MAX_ACTIVE_CASES,
} from "@/lib/cases";
import {
  getAllEvidence,
  getConnections,
  getEvidenceForCase,
} from "@/lib/evidence";
import {
  resolveCase,
  getMissingEvidenceHints,
  calculateEvidenceCompleteness,
} from "@/lib/case-resolution";
import {
  seedAvailableCases,
  getStarterContent,
  createStarterEvidence,
} from "@/lib/case-generator";
import { addMultipleEvidence } from "@/lib/evidence";

/**
 * GET /api/cases - Get available cases or user's active cases
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const caseId = searchParams.get("id");

  try {
    // Get a single case by ID (checks both active and available)
    // Check this FIRST before type-based queries
    if (caseId) {
      // First check active cases
      let caseData = await getActiveCase(DEV_USER_ID, caseId);

      // If not active, check available cases
      if (!caseData) {
        caseData = await getAvailableCase(caseId);
      }

      if (!caseData) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      return NextResponse.json({ case: caseData });
    }

    if (type === "available" || !type) {
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
      return NextResponse.json({
        active,
        history,
        maxActive: MAX_ACTIVE_CASES,
      });
    }

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[API] Cases GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 },
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
        return NextResponse.json({ error: "caseId required" }, { status: 400 });
      }

      const acceptedCase = await acceptCase(DEV_USER_ID, caseId);

      // Grant case-relevant evidence from the starter pool
      const allStarterEvidence = createStarterEvidence();
      const caseEvidence = allStarterEvidence.filter(
        (e) => e.caseRelevance && e.caseRelevance.includes(caseId),
      );

      if (caseEvidence.length > 0) {
        // Update acquiredAt to now for freshness
        const evidenceToGrant = caseEvidence.map((e) => ({
          ...e,
          acquiredAt: new Date().toISOString(),
          acquiredFrom: "case_accept" as const,
        }));
        await addMultipleEvidence(DEV_USER_ID, evidenceToGrant);
      }

      return NextResponse.json({
        case: acceptedCase,
        evidenceGranted: caseEvidence.length,
      });
    }

    if (action === "abandon") {
      if (!caseId) {
        return NextResponse.json({ error: "caseId required" }, { status: 400 });
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
        return NextResponse.json({ error: "caseId required" }, { status: 400 });
      }

      const activeCase = await getActiveCase(DEV_USER_ID, caseId);
      if (!activeCase) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      return NextResponse.json({ case: activeCase });
    }

    if (action === "solve") {
      const { theory } = body;

      if (!caseId) {
        return NextResponse.json({ error: "caseId required" }, { status: 400 });
      }

      // Get the active case
      const activeCase = await getActiveCase(DEV_USER_ID, caseId);
      if (!activeCase) {
        return NextResponse.json(
          { error: "Case not found in active cases" },
          { status: 404 },
        );
      }

      // Get evidence and connections
      const allEvidence = await getAllEvidence(DEV_USER_ID);
      const connections = await getConnections(DEV_USER_ID);

      // Calculate completeness
      const completeness = calculateEvidenceCompleteness(
        activeCase,
        allEvidence,
      );

      // If less than 50% and no theory, return hints
      if (completeness < 0.5 && !theory) {
        const hints = getMissingEvidenceHints(activeCase, allEvidence);
        return NextResponse.json({
          canSolve: false,
          completeness,
          hints,
          message: "Insufficient evidence to solve this case.",
        });
      }

      // If no theory provided, prompt for one
      if (!theory) {
        return NextResponse.json({
          canSolve: true,
          completeness,
          needsTheory: true,
          case: activeCase,
        });
      }

      // Resolve the case
      const resolution = resolveCase(
        activeCase,
        allEvidence,
        connections,
        theory,
      );

      // Complete the case in storage
      await completeCase(DEV_USER_ID, caseId, resolution.outcome, theory);

      return NextResponse.json({
        resolved: true,
        outcome: resolution.outcome,
        description: resolution.description,
        rewards: resolution.rewards,
        formattedRewards: resolution.formattedRewards,
        case: { ...activeCase, outcome: resolution.outcome, theory },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[API] Cases POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
