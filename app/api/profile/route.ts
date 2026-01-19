import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getUserProfile,
  createUserProfile,
  updateNickname,
  validateNickname,
} from "@/lib/profile";
import { cookies } from "next/headers";

/**
 * GET /api/profile - Get the current user's profile
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);

  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({ profile });
}

/**
 * POST /api/profile - Create a new profile (onboarding)
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if profile already exists
  const existingProfile = await getUserProfile(session.user.id);
  if (existingProfile?.onboardingComplete) {
    return NextResponse.json(
      { error: "Profile already exists" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { nickname } = body;

  // Validate nickname
  const validation = validateNickname(nickname);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Get Discord info from session
  const discordUsername = session.user.discordUsername || session.user.name || "unknown";
  const discordAvatar = session.user.discordAvatar || session.user.image || "";

  // Create profile
  const profile = await createUserProfile(
    session.user.id,
    nickname,
    discordUsername,
    discordAvatar,
  );

  // Set onboarded cookie
  const cookieStore = await cookies();
  cookieStore.set("onboarded", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return NextResponse.json({ profile });
}

/**
 * PATCH /api/profile - Update profile (e.g., nickname)
 */
export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { nickname } = body;

  if (nickname !== undefined) {
    // Validate nickname
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const profile = await updateNickname(session.user.id, nickname);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  }

  return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
}
