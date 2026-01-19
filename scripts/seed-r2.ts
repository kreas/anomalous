#!/usr/bin/env tsx
/**
 * Seed R2 storage with mock data
 *
 * Usage:
 *   pnpm seed              # Upload all mock data to R2
 *   pnpm seed:dry-run      # Preview what would be uploaded
 *   pnpm seed -- --user=<userId>  # Also seed evidence to a specific user
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { Case, Evidence } from "@/types";

const R2_PREFIX = "anomanet/";

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const userArg = args.find(arg => arg.startsWith("--user="));
const userId = userArg ? userArg.split("=")[1] : null;

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const bucket = process.env.R2_BUCKET || "mythic-os";

function prefixKey(key: string): string {
  return `${R2_PREFIX}${key}`;
}

async function putObject<T>(key: string, data: T): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: prefixKey(key),
    Body: JSON.stringify(data, null, 2),
    ContentType: "application/json",
  });
  await s3Client.send(command);
}

async function loadJsonFiles<T>(directory: string): Promise<T[]> {
  const files = await readdir(directory);
  const jsonFiles = files.filter(f => f.endsWith(".json"));

  const items: T[] = [];
  for (const file of jsonFiles) {
    const content = await readFile(join(directory, file), "utf-8");
    items.push(JSON.parse(content) as T);
  }
  return items;
}

async function seedCases(cases: Case[]): Promise<void> {
  console.log(`\nSeeding ${cases.length} cases to R2...`);

  for (const caseData of cases) {
    const key = `cases/available/${caseData.id}.json`;

    // Add postedAt timestamp if not present
    const caseWithTimestamp = {
      ...caseData,
      postedAt: caseData.postedAt || new Date().toISOString(),
    };

    if (dryRun) {
      console.log(`  [DRY RUN] Would upload: ${key}`);
      console.log(`    Title: ${caseData.title}`);
    } else {
      await putObject(key, caseWithTimestamp);
      console.log(`  Uploaded: ${key} (${caseData.title})`);
    }
  }
}

async function seedEvidence(evidence: Evidence[], targetUserId?: string): Promise<void> {
  if (!targetUserId) {
    console.log("\nSkipping evidence seeding (no --user specified)");
    console.log("  To seed evidence, run: pnpm seed -- --user=<userId>");
    return;
  }

  console.log(`\nSeeding ${evidence.length} evidence items to user: ${targetUserId}`);

  // Add acquiredAt timestamp if not present
  const evidenceWithTimestamps = evidence.map(e => ({
    ...e,
    acquiredAt: e.acquiredAt || new Date().toISOString(),
  }));

  const key = `users/${targetUserId}/evidence.json`;

  if (dryRun) {
    console.log(`  [DRY RUN] Would upload: ${key}`);
    for (const e of evidence) {
      console.log(`    - ${e.id}: ${e.name}`);
    }
  } else {
    await putObject(key, evidenceWithTimestamps);
    console.log(`  Uploaded: ${key}`);
    for (const e of evidence) {
      console.log(`    - ${e.id}: ${e.name}`);
    }
  }
}

async function main(): Promise<void> {
  console.log("=== R2 Mock Data Seeder ===");
  if (dryRun) {
    console.log("Mode: DRY RUN (no changes will be made)");
  } else {
    console.log("Mode: LIVE (uploading to R2)");
  }

  // Check for required environment variables
  if (!dryRun) {
    if (!process.env.R2_ENDPOINT) {
      console.error("Error: R2_ENDPOINT environment variable is required");
      process.exit(1);
    }
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.error("Error: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required");
      process.exit(1);
    }
  }

  const mocksDir = join(process.cwd(), "mocks");

  // Load and seed cases
  const cases = await loadJsonFiles<Case>(join(mocksDir, "cases"));
  await seedCases(cases);

  // Load and seed evidence
  const evidence = await loadJsonFiles<Evidence>(join(mocksDir, "evidence"));
  await seedEvidence(evidence, userId || undefined);

  console.log("\n=== Seeding complete ===");
  if (dryRun) {
    console.log("Run without --dry-run to apply changes.");
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
