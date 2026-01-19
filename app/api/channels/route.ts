/**
 * Channel state API endpoint
 * GET: Fetch user's channel state
 * POST: Update channel state (unlock, mark read, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import {
  getOrCreateChannelState,
  markChannelRead,
  unlockChannel,
  removeQueryWindow,
} from "@/lib/channels";
import { getOrCreateQueryWindow, markQueryRead } from "@/lib/queries";
import { checkAndUnlockChannels } from "@/lib/channel-unlocks";

export interface ChannelStateResponse {
  success: boolean;
  data?: Awaited<ReturnType<typeof getOrCreateChannelState>>;
  error?: string;
}

export interface ChannelUpdateRequest {
  action:
    | "mark_read"
    | "unlock"
    | "open_query"
    | "close_query"
    | "check_unlocks";
  channelId?: string;
  targetUserId?: string;
  targetUsername?: string;
}

export interface ChannelUpdateResponse {
  success: boolean;
  data?: Awaited<ReturnType<typeof getOrCreateChannelState>>;
  unlockedChannels?: string[];
  error?: string;
}

/**
 * GET /api/channels
 * Returns user's channel state including query windows
 */
export async function GET(): Promise<NextResponse<ChannelStateResponse>> {
  try {
    const userId = await getUserId();
    const state = await getOrCreateChannelState(userId);

    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error("Error fetching channel state:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch channel state",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/channels
 * Update channel state based on action
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ChannelUpdateResponse>> {
  try {
    const userId = await getUserId();
    const body = (await request.json()) as ChannelUpdateRequest;
    const { action, channelId, targetUserId, targetUsername } = body;

    switch (action) {
      case "mark_read": {
        if (!channelId) {
          return NextResponse.json(
            { success: false, error: "channelId required" },
            { status: 400 },
          );
        }

        // Check if it's a query window or regular channel
        if (channelId.startsWith("query-")) {
          await markQueryRead(userId, channelId);
        } else {
          await markChannelRead(userId, channelId);
        }

        const state = await getOrCreateChannelState(userId);
        return NextResponse.json({ success: true, data: state });
      }

      case "unlock": {
        if (!channelId) {
          return NextResponse.json(
            { success: false, error: "channelId required" },
            { status: 400 },
          );
        }

        await unlockChannel(userId, channelId);
        const state = await getOrCreateChannelState(userId);
        return NextResponse.json({ success: true, data: state });
      }

      case "open_query": {
        if (!targetUserId || !targetUsername) {
          return NextResponse.json(
            {
              success: false,
              error: "targetUserId and targetUsername required",
            },
            { status: 400 },
          );
        }

        const { state } = await getOrCreateQueryWindow(
          userId,
          targetUserId,
          targetUsername,
        );
        return NextResponse.json({ success: true, data: state });
      }

      case "close_query": {
        if (!channelId) {
          return NextResponse.json(
            { success: false, error: "channelId required" },
            { status: 400 },
          );
        }

        await removeQueryWindow(userId, channelId);
        const state = await getOrCreateChannelState(userId);
        return NextResponse.json({ success: true, data: state });
      }

      case "check_unlocks": {
        const unlockedChannels = await checkAndUnlockChannels(userId);
        const state = await getOrCreateChannelState(userId);
        return NextResponse.json({
          success: true,
          data: state,
          unlockedChannels,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error updating channel state:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update channel state",
      },
      { status: 500 },
    );
  }
}
