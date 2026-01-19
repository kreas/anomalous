/**
 * Message history API endpoint
 * GET: Fetch messages for a channel
 * POST: Save a message to channel history
 */

import { NextRequest, NextResponse } from "next/server";
import { DEV_USER_ID } from "@/lib/constants";
import type { ChannelMessage, GetMessagesOptions } from "@/types";
import {
  getLatestMessages,
  getChannelMessages,
  saveChannelMessage,
  createChannelMessage,
  createSystemMessage,
} from "@/lib/messages";
import { incrementUnreadCount } from "@/lib/channels";
import { incrementQueryUnread, isQueryWindowId } from "@/lib/queries";

export interface MessagesResponse {
  success: boolean;
  data?: ChannelMessage[];
  error?: string;
}

export interface SaveMessageRequest {
  channelId: string;
  content: string;
  username: string;
  type?: ChannelMessage["type"];
  userId?: string;
}

export interface SaveMessageResponse {
  success: boolean;
  data?: ChannelMessage;
  error?: string;
}

/**
 * GET /api/messages
 * Returns messages for a channel with optional pagination
 *
 * Query params:
 * - channelId: required
 * - limit: number of messages (default 50)
 * - before: ISO timestamp for pagination
 * - after: ISO timestamp for pagination
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<MessagesResponse>> {
  try {
    const userId = DEV_USER_ID;
    const { searchParams } = new URL(request.url);

    const channelId = searchParams.get("channelId");
    if (!channelId) {
      return NextResponse.json(
        { success: false, error: "channelId required" },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const before = searchParams.get("before") || undefined;
    const after = searchParams.get("after") || undefined;

    const options: GetMessagesOptions = { limit, before, after };

    let messages: ChannelMessage[];

    if (!before && !after) {
      // Simple case: get latest messages
      messages = await getLatestMessages(userId, channelId, limit);
    } else {
      // Pagination case
      messages = await getChannelMessages(userId, channelId, options);
    }

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch messages",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * Save a new message to channel history
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveMessageResponse>> {
  try {
    const userId = DEV_USER_ID;
    const body = (await request.json()) as SaveMessageRequest;
    const { channelId, content, username, type = "message" } = body;

    if (!channelId || !content) {
      return NextResponse.json(
        { success: false, error: "channelId and content required" },
        { status: 400 }
      );
    }

    // Create the message
    let message: ChannelMessage;

    if (type === "system") {
      message = createSystemMessage(channelId, content);
    } else {
      message = createChannelMessage(
        channelId,
        body.userId || userId,
        username || "Anonymous",
        content,
        type
      );
    }

    // Save to R2
    await saveChannelMessage(userId, channelId, message);

    // Increment unread count for the channel
    // (In a real app, we'd only do this if the channel isn't currently active)
    if (isQueryWindowId(channelId)) {
      await incrementQueryUnread(userId, channelId);
    } else {
      await incrementUnreadCount(userId, channelId);
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save message",
      },
      { status: 500 }
    );
  }
}
