"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Capacitor } from "@capacitor/core";
import { signOut } from "next-auth/react";
import { ChatMessage, Message } from "@/app/components/ChatMessage";
import {
  ChannelList,
  ChannelListItem,
  channelToListItem,
  queryWindowToListItem,
} from "@/app/components/ChannelList";
import { UserList, User } from "@/app/components/UserList";
import { ChatInput } from "@/app/components/ChatInput";
import type { EntityPresence } from "@/app/api/entities/route";
import type { ChannelState, ChannelMessage as ChannelMsg } from "@/types";
import {
  parseCommand,
  executeCommand,
  type CommandContext,
  type CommandResult,
} from "@/lib/commands";
import type { Case, Evidence } from "@/types";
import { getChannelIntro } from "@/lib/channel-intros";
import { isQueryWindowId, getQueryWindowId } from "@/lib/queries";

// Static mock users (non-entity NPCs)
const staticMockUsers: User[] = [
  { id: "1", username: "CipherY", status: "online", mode: "@" },
  { id: "2", username: "NightOwl44", status: "online", mode: "+" },
  { id: "3", username: "DataMiner", status: "online" },
  { id: "4", username: "GhostInShell", status: "away" },
  { id: "5", username: "ByteRunner", status: "away" },
  { id: "6", username: "ShadowNet", status: "offline" },
];

export default function HomeContent() {
  // Channel state from R2
  const [channelState, setChannelState] = useState<ChannelState | null>(null);
  const [activeChannelId, setActiveChannelId] = useState("lobby");

  // Message cache per channel (client-side)
  const [messageCache, setMessageCache] = useState<Record<string, Message[]>>(
    {},
  );
  const [loadingChannel, setLoadingChannel] = useState(false);

  // Entity and user state
  const [entityUsers, setEntityUsers] = useState<User[]>([]);
  const [entityName, setEntityName] = useState("Anonymous");

  // UI state
  const [showChannels, setShowChannels] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current channel/query info
  const isCurrentChannelQuery = isQueryWindowId(activeChannelId);
  const activeChannel = useMemo(() => {
    if (!channelState) return null;
    if (isCurrentChannelQuery) {
      return channelState.queryWindows.find((q) => q.id === activeChannelId);
    }
    return channelState.channels.find((c) => c.id === activeChannelId);
  }, [channelState, activeChannelId, isCurrentChannelQuery]);

  // Build channel list items
  const channelListItems: ChannelListItem[] = useMemo(() => {
    if (!channelState) return [];
    return channelState.channels.map(channelToListItem);
  }, [channelState]);

  const queryWindowItems: ChannelListItem[] = useMemo(() => {
    if (!channelState) return [];
    return channelState.queryWindows.map(queryWindowToListItem);
  }, [channelState]);

  // Combine entity users with static mock users
  const users = useMemo(() => {
    return [...entityUsers, ...staticMockUsers];
  }, [entityUsers]);

  // Get messages for current channel
  const currentMessages = useMemo(() => {
    return messageCache[activeChannelId] || [];
  }, [messageCache, activeChannelId]);

  // Fetch channel state on mount
  useEffect(() => {
    const fetchChannelState = async () => {
      try {
        const response = await fetch("/api/channels");
        const data = await response.json();
        if (data.success && data.data) {
          setChannelState(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch channel state:", error);
      }
    };

    fetchChannelState();
  }, []);

  // Fetch entities on mount
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const response = await fetch("/api/entities");
        const data: { entities: EntityPresence[] } = await response.json();

        const entityAsUsers: User[] = data.entities.map((entity) => ({
          id: `entity-${entity.id}`,
          username: entity.name,
          status: entity.status,
          mode: entity.mode || undefined,
          phase: entity.phase,
        }));

        setEntityUsers(entityAsUsers);

        if (data.entities.length > 0) {
          setEntityName(data.entities[0].name);
        }
      } catch (error) {
        console.error("Failed to fetch entities:", error);
        setEntityUsers([
          {
            id: "entity-anonymous",
            username: "Anonymous",
            status: "online",
            mode: "",
            phase: "awakening",
          },
        ]);
        setEntityName("Anonymous");
      }
    };

    fetchEntities();
  }, []);

  // Load messages for a channel
  const loadChannelMessages = useCallback(
    async (channelId: string) => {
      // Skip if already cached
      if (messageCache[channelId]) return;

      setLoadingChannel(true);
      try {
        const response = await fetch(
          `/api/messages?channelId=${encodeURIComponent(channelId)}&limit=50`,
        );
        const data = await response.json();

        if (data.success && data.data) {
          // Convert ChannelMessage to Message format
          const messages: Message[] = data.data.map((msg: ChannelMsg) => ({
            id: msg.id,
            timestamp: new Date(msg.timestamp),
            username: msg.username,
            content: msg.content,
            type: msg.type === "part" ? "leave" : msg.type,
          }));

          // If no messages, add channel intro
          if (messages.length === 0 && !isQueryWindowId(channelId)) {
            const channel = channelState?.channels.find(
              (c) => c.id === channelId,
            );
            if (channel) {
              const intro = getChannelIntro(channel.type);
              if (intro) {
                messages.push({
                  id: `intro-${channelId}`,
                  timestamp: new Date(),
                  username: "***",
                  content: intro,
                  type: "system",
                });
              }
            }
          }

          setMessageCache((prev) => ({
            ...prev,
            [channelId]: messages,
          }));
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
        // Add error message
        setMessageCache((prev) => ({
          ...prev,
          [channelId]: [
            {
              id: `error-${channelId}`,
              timestamp: new Date(),
              username: "***",
              content: "Failed to load message history.",
              type: "system",
            },
          ],
        }));
      } finally {
        setLoadingChannel(false);
      }
    },
    [messageCache, channelState],
  );

  // Load messages when channel changes
  useEffect(() => {
    if (activeChannelId) {
      loadChannelMessages(activeChannelId);
    }
  }, [activeChannelId, loadChannelMessages]);

  // Add initial intro message for lobby if no messages cached
  useEffect(() => {
    if (channelState && !messageCache["lobby"]) {
      setMessageCache((prev) => ({
        ...prev,
        lobby: [
          {
            id: "intro-lobby",
            timestamp: new Date(),
            username: "***",
            content: getChannelIntro("lobby"),
            type: "system",
          },
        ],
      }));
    }
  }, [channelState, messageCache]);

  // AI Chat hook for entity conversations
  const {
    messages: aiMessages,
    sendMessage: sendAIMessage,
    status,
    error,
    setMessages: setAIMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  // Track which AI messages have been persisted to avoid duplicates
  const persistedMessageIds = useRef<Set<string>>(new Set());

  // Track which channel the current AI conversation belongs to
  const aiConversationChannelRef = useRef<string>(activeChannelId);

  // Persist AI responses when streaming completes (only assistant messages)
  useEffect(() => {
    if (status === "ready" && aiMessages.length > 0) {
      // Find assistant messages that haven't been persisted yet
      const newAssistantMessages = aiMessages.filter(
        (msg) =>
          msg.role === "assistant" && !persistedMessageIds.current.has(msg.id),
      );

      // Persist each new assistant message
      newAssistantMessages.forEach(async (msg) => {
        // Extract content from parts
        const content = msg.parts
          .filter(
            (part): part is { type: "text"; text: string } =>
              part.type === "text",
          )
          .map((part) => part.text)
          .join("");

        if (content) {
          // Persist to R2 using the channel where conversation started
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId: aiConversationChannelRef.current,
              content,
              username: entityName,
              type: "message",
            }),
          });

          // Mark as persisted
          persistedMessageIds.current.add(msg.id);
        }
      });
    }
  }, [status, aiMessages, entityName]);

  // Clear AI messages when switching to a different channel type
  // This prevents messages from appearing in wrong channels
  useEffect(() => {
    // If switching away from entity conversation context, clear AI state
    const wasEntityContext =
      aiConversationChannelRef.current === "lobby" ||
      aiConversationChannelRef.current.includes("anonymous");
    const isEntityContext =
      activeChannelId === "lobby" || activeChannelId.includes("anonymous");

    if (wasEntityContext && !isEntityContext) {
      // Switching from entity context to non-entity channel
      setAIMessages([]);
      persistedMessageIds.current.clear();
    }

    // Update the ref to track current channel
    aiConversationChannelRef.current = activeChannelId;
  }, [activeChannelId, setAIMessages]);

  // Convert AI messages and merge with channel messages
  const allMessages = useMemo(() => {
    // For query windows with the entity, include AI messages
    if (isCurrentChannelQuery && activeChannelId.includes("anonymous")) {
      const convertedAIMessages: Message[] = aiMessages.map((msg) => {
        const content = msg.parts
          .filter(
            (part): part is { type: "text"; text: string } =>
              part.type === "text",
          )
          .map((part) => part.text)
          .join("");

        return {
          id: msg.id,
          timestamp: new Date(),
          username: msg.role === "user" ? "You" : entityName,
          content,
          type: "message" as const,
        };
      });

      return [...currentMessages, ...convertedAIMessages];
    }

    // For lobby channel with entity, also show AI messages (legacy behavior)
    if (activeChannelId === "lobby") {
      const convertedAIMessages: Message[] = aiMessages.map((msg) => {
        const content = msg.parts
          .filter(
            (part): part is { type: "text"; text: string } =>
              part.type === "text",
          )
          .map((part) => part.text)
          .join("");

        return {
          id: msg.id,
          timestamp: new Date(),
          username: msg.role === "user" ? "You" : entityName,
          content,
          type: "message" as const,
        };
      });

      return [...currentMessages, ...convertedAIMessages];
    }

    return currentMessages;
  }, [
    currentMessages,
    aiMessages,
    entityName,
    isCurrentChannelQuery,
    activeChannelId,
  ]);

  const isStreaming = status === "streaming";

  // Add system message to current channel
  const addSystemMessage = useCallback(
    (content: string) => {
      const message: Message = {
        id: `sys-${Date.now()}`,
        timestamp: new Date(),
        username: "***",
        content,
        type: "system",
      };

      setMessageCache((prev) => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), message],
      }));
    },
    [activeChannelId],
  );

  // Add action message to current channel
  const addActionMessage = useCallback(
    (username: string, content: string) => {
      const message: Message = {
        id: `action-${Date.now()}`,
        timestamp: new Date(),
        username,
        content,
        type: "action",
      };

      setMessageCache((prev) => ({
        ...prev,
        [activeChannelId]: [...(prev[activeChannelId] || []), message],
      }));
    },
    [activeChannelId],
  );

  // Handle API call responses from commands
  const handleApiResponse = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (handler: string, data: any) => {
      switch (handler) {
        case "case_list": {
          // GET /api/cases?type=active response
          const { active, maxActive } = data;
          if (!active || active.length === 0) {
            addSystemMessage(
              `No active cases. Visit #mysteries to find cases.\nYou can have up to ${maxActive || 3} active cases.`,
            );
            return;
          }
          const caseList = active
            .map((c: Case, i: number) => {
              const statusBadge = `[${c.status.toUpperCase()}]`;
              const evidenceCount = c.requiredEvidence.reduce(
                (sum: number, e: { count: number }) => sum + e.count,
                0,
              );
              return `${i + 1}. ${statusBadge} ${c.title} (${c.type})\n   Evidence needed: ${evidenceCount} items\n   ID: ${c.id}`;
            })
            .join("\n\n");
          addSystemMessage(
            `Active Cases (${active.length}/${maxActive || 3}):\n\n${caseList}\n\nUse /case <id> for details`,
          );
          break;
        }

        case "case_available": {
          // GET /api/cases?type=available response
          const { cases } = data;
          if (!cases || cases.length === 0) {
            addSystemMessage(
              "No cases available at this time. Check back later.",
            );
            return;
          }
          const caseList = cases
            .slice(0, 10)
            .map((c: Case) => {
              const rarityBadge = `[${c.rarity.toUpperCase()}]`;
              return `${rarityBadge} ${c.title}\n  ${c.description}\n  Reward: ${c.rewards.fragments} Fragments, ${c.rewards.xp} XP\n  /accept ${c.id}`;
            })
            .join("\n\n");
          addSystemMessage(`=== Available Cases ===\n\n${caseList}`);
          break;
        }

        case "case_detail": {
          // GET /api/cases?id=<id> response
          const caseData = data.case as Case;
          if (!caseData) {
            addSystemMessage("Case not found.");
            return;
          }
          const isActive = caseData.status !== "available";
          const statusLine = isActive
            ? `Status: ${caseData.status.toUpperCase()}`
            : "Status: Available (use /accept to take this case)";
          const evidenceReqs = caseData.requiredEvidence
            .map(
              (e: { type: string; count: number; hint?: string }) =>
                `  - ${e.type}: ${e.count} needed${e.hint ? ` (${e.hint})` : ""}`,
            )
            .join("\n");
          const rewards = `XP: ${caseData.rewards.xp} | Fragments: ${caseData.rewards.fragments}`;
          const details = [
            `=== ${caseData.title} ===`,
            `Type: ${caseData.type} | Rarity: ${caseData.rarity.toUpperCase()}`,
            statusLine,
            "",
            caseData.briefing,
            "",
            "Evidence Required:",
            evidenceReqs,
            "",
            `Rewards: ${rewards}`,
          ].join("\n");
          addSystemMessage(details);
          break;
        }

        case "case_accept": {
          // POST /api/cases { action: "accept" } response
          const acceptedCase = data.case as Case;
          if (!acceptedCase) {
            addSystemMessage(data.error || "Failed to accept case.");
            return;
          }
          const evidenceGranted = data.evidenceGranted as number | undefined;
          let message = `Case accepted: ${acceptedCase.title}\n\n${acceptedCase.briefing}`;
          if (evidenceGranted && evidenceGranted > 0) {
            message += `\n\n--- EVIDENCE ACQUIRED ---\n${evidenceGranted} evidence item${evidenceGranted > 1 ? "s" : ""} added to your inventory.\nUse /evidence to view your inventory.`;
          }
          addSystemMessage(message);
          break;
        }

        case "case_abandon": {
          // POST /api/cases { action: "abandon" } response
          const abandonedCase = data.case as Case;
          if (!abandonedCase) {
            addSystemMessage(data.error || "Failed to abandon case.");
            return;
          }
          addSystemMessage(
            `Case abandoned: ${abandonedCase.title}\nThe case has been moved to your history.`,
          );
          break;
        }

        case "case_solve": {
          // POST /api/cases { action: "solve" } response
          if (data.error) {
            addSystemMessage(data.error);
            return;
          }
          if (data.canSolve === false) {
            const hints = data.hints || [];
            addSystemMessage(
              `Insufficient evidence to solve this case.\n\nMissing:\n${hints.map((h: string) => `  - ${h}`).join("\n")}\n\nGather more evidence before attempting to solve.`,
            );
            return;
          }
          if (data.needsTheory) {
            const caseData = data.case as Case;
            const completeness = data.completeness || 0;
            addSystemMessage(
              `=== SOLVE: ${caseData.title} ===\n\nEvidence collected: ${Math.round(completeness * 100)}%\n\nProvide your theory:\n/solve ${caseData.id} <your theory of what happened>`,
            );
            return;
          }
          if (data.resolved) {
            const outcomeMap: Record<string, string> = {
              solved: "SOLVED",
              partial: "PARTIAL",
              cold: "COLD",
              twist: "TWIST REVEALED",
            };
            const caseData = data.case as Case;
            const message = [
              `=== CASE ${outcomeMap[data.outcome] || data.outcome} ===`,
              caseData.title,
              "",
              data.description,
              "",
              `Your theory: "${caseData.theory}"`,
              "",
              "Rewards:",
              data.formattedRewards,
            ].join("\n");
            addSystemMessage(message);
          }
          break;
        }

        case "evidence_list": {
          // GET /api/evidence response
          const { items, byType, unexaminedCount, total } = data;
          if (!items || items.length === 0) {
            addSystemMessage(
              "Your evidence inventory is empty.\nAccept cases with /accept to acquire evidence.",
            );
            return;
          }
          const typeLabels: Record<string, string> = {
            chat_log: "Chat Logs",
            data_fragment: "Data Fragments",
            testimony: "Testimonies",
            access_key: "Access Keys",
            tool: "Tools",
            coordinates: "Coordinates",
          };
          const sections: string[] = [];
          for (const [type, typeItems] of Object.entries(byType || {})) {
            const evidenceItems = typeItems as Evidence[];
            if (evidenceItems.length === 0) continue;
            const itemList = evidenceItems
              .map((e: Evidence) => {
                const newBadge = e.examined ? "" : "[NEW] ";
                return `  ${newBadge}${e.id} - ${e.name}`;
              })
              .join("\n");
            sections.push(`${typeLabels[type] || type}:\n${itemList}`);
          }
          const header = `Evidence Inventory (${total} items${unexaminedCount > 0 ? `, ${unexaminedCount} new` : ""}):\n`;
          addSystemMessage(
            header +
              "\n" +
              sections.join("\n\n") +
              "\n\nUse /evidence <id> to view, /evidence examine <id> to examine",
          );
          break;
        }

        case "evidence_detail": {
          // GET /api/evidence?id=<id> response
          const evidence = data.evidence as Evidence;
          if (!evidence) {
            addSystemMessage(data.error || "Evidence not found.");
            return;
          }
          const examineStatus = evidence.examined
            ? "Examined"
            : "Not examined - use /evidence examine " + evidence.id;
          const details = [
            `=== ${evidence.name} ===`,
            `Type: ${evidence.type} | Rarity: ${evidence.rarity.toUpperCase()}`,
            `Status: ${examineStatus}`,
            "",
            evidence.description,
          ];
          if (evidence.examined && evidence.content) {
            details.push("");
            details.push(evidence.content);
          }
          if (evidence.connections && evidence.connections.length > 0) {
            details.push("");
            details.push(
              `Potential connections: ${evidence.connections.length} items`,
            );
          }
          addSystemMessage(details.join("\n"));
          break;
        }

        case "evidence_examine": {
          // POST /api/evidence { action: "examine" } response
          const evidence = data.evidence as Evidence;
          if (!evidence) {
            addSystemMessage(data.error || "Evidence not found.");
            return;
          }
          const formattedContent =
            data.formattedContent || evidence.content || "";
          const xpByRarity: Record<string, number> = {
            common: 5,
            uncommon: 10,
            rare: 20,
            legendary: 50,
          };
          const xpReward = xpByRarity[evidence.rarity] || 5;
          addSystemMessage(
            `=== EXAMINING: ${evidence.name} ===\n\n${formattedContent}\n\n+${xpReward} XP for examination`,
          );
          break;
        }

        case "evidence_connect": {
          // POST /api/evidence { action: "connect" } response
          if (!data.connected) {
            addSystemMessage(data.insight || "No connection found.");
            return;
          }
          const connection = data.connection;
          const xpReward = connection?.reward?.xp || 10;
          addSystemMessage(
            `=== CONNECTION DISCOVERED ===\n\n${connection?.insight || "Connection established."}\n\n+${xpReward} XP`,
          );
          break;
        }

        case "auth_whoami": {
          // GET /api/profile response
          const profile = data.profile;
          if (!profile) {
            addSystemMessage(
              "Profile not found. You may need to complete onboarding.",
            );
            return;
          }
          addSystemMessage(
            `=== YOUR PROFILE ===\nNickname: ${profile.nickname}\nDiscord: ${profile.discordUsername}\nJoined: ${new Date(profile.createdAt).toLocaleDateString()}`,
          );
          break;
        }

        default:
          addSystemMessage(`Unknown API response handler: ${handler}`);
      }
    },
    [addSystemMessage],
  );

  // Handle command result
  const handleCommandResult = useCallback(
    async (result: CommandResult) => {
      switch (result.action) {
        case "system_message":
          if (result.message) {
            addSystemMessage(result.message);
          }
          break;

        case "api_call":
          // Execute API call and handle response
          if (result.apiCall) {
            try {
              const { endpoint, method, body, handler } = result.apiCall;
              const fetchOptions: RequestInit = {
                method,
                headers: { "Content-Type": "application/json" },
              };
              if (body && method === "POST") {
                fetchOptions.body = JSON.stringify(body);
              }
              const response = await fetch(endpoint, fetchOptions);
              const data = await response.json();

              if (!response.ok) {
                addSystemMessage(
                  data.error || `Request failed: ${response.status}`,
                );
                return;
              }

              handleApiResponse(handler, data);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Request failed";
              addSystemMessage(`Error: ${message}`);
            }
          }
          break;

        case "switch_channel":
          if (result.data?.channelId) {
            setActiveChannelId(result.data.channelId);
            setShowChannels(false);
          }
          break;

        case "open_query":
          if (result.data?.targetUserId && result.data?.targetUsername) {
            // Create/open query window via API
            await fetch("/api/channels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "open_query",
                targetUserId: result.data.targetUserId,
                targetUsername: result.data.targetUsername,
              }),
            });

            // Refresh channel state
            const response = await fetch("/api/channels");
            const data = await response.json();
            if (data.success && data.data) {
              setChannelState(data.data);
            }

            // Switch to query window
            const queryId = getQueryWindowId(result.data.targetUserId);
            setActiveChannelId(queryId);
          }
          break;

        case "close_query":
          if (result.data?.channelId) {
            // Close query via API
            await fetch("/api/channels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "close_query",
                channelId: result.data.channelId,
              }),
            });

            // Refresh channel state
            const response = await fetch("/api/channels");
            const data = await response.json();
            if (data.success && data.data) {
              setChannelState(data.data);
            }

            // Switch to lobby
            setActiveChannelId("lobby");
          }
          break;

        case "clear_display":
          // Clear messages for current channel (client-side only)
          setMessageCache((prev) => ({
            ...prev,
            [activeChannelId]: [],
          }));
          // Also clear AI messages if in entity context
          if (
            activeChannelId === "lobby" ||
            activeChannelId.includes("anonymous")
          ) {
            setAIMessages([]);
          }
          break;

        case "action_message":
          if (result.data?.messageContent) {
            addActionMessage("You", result.data.messageContent);
          }
          break;

        case "send_message":
          // Open query window and send message
          if (
            result.data?.targetUserId &&
            result.data?.targetUsername &&
            result.data?.messageContent
          ) {
            // Open query
            await fetch("/api/channels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "open_query",
                targetUserId: result.data.targetUserId,
                targetUsername: result.data.targetUsername,
              }),
            });

            // Refresh and switch
            const response = await fetch("/api/channels");
            const data = await response.json();
            if (data.success && data.data) {
              setChannelState(data.data);
            }

            const queryId = getQueryWindowId(result.data.targetUserId);
            setActiveChannelId(queryId);

            // If messaging the entity, send via AI
            if (result.data.targetUserId.includes("anonymous")) {
              sendAIMessage({ text: result.data.messageContent });
            } else {
              // For NPCs, just show the sent message
              const message: Message = {
                id: `msg-${Date.now()}`,
                timestamp: new Date(),
                username: "You",
                content: result.data.messageContent,
                type: "message",
              };

              setMessageCache((prev) => ({
                ...prev,
                [queryId]: [...(prev[queryId] || []), message],
              }));

              // TODO: Add NPC response (Phase 6)
            }
          }
          break;

        // Phase 3: Case & Evidence Actions
        case "case_accepted":
        case "case_list":
        case "case_detail":
        case "case_abandoned":
        case "evidence_list":
        case "evidence_detail":
        case "evidence_examined":
        case "connection_found":
        case "connection_failed":
        case "solve_prompt":
        case "case_resolved":
          // All Phase 3 actions include their output in result.message
          if (result.message) {
            addSystemMessage(result.message);
          }
          break;

        // Auth actions
        case "auth_signout":
          if (result.message) {
            addSystemMessage(result.message);
          }
          // Use next-auth signOut to properly handle session cleanup
          signOut({ callbackUrl: "/auth/signin" });
          break;
      }
    },
    [
      activeChannelId,
      addSystemMessage,
      addActionMessage,
      setAIMessages,
      sendAIMessage,
      handleApiResponse,
    ],
  );

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      // Check if it's a command
      const parsed = parseCommand(content);

      if (parsed) {
        // Build command context - include ALL users (entities + NPCs)
        const context: CommandContext = {
          userId: "dev-user", // Will be replaced with real user ID
          currentChannel: activeChannelId,
          channelState: channelState || {
            channels: [],
            queryWindows: [],
            lastUpdated: new Date().toISOString(),
          },
          entityUsers: users.map((u) => ({
            id: u.id.replace("entity-", ""),
            name: u.username,
          })),
        };

        const result = await executeCommand(content, context);
        await handleCommandResult(result);
      } else {
        // Regular message
        if (activeChannelId === "lobby" || isCurrentChannelQuery) {
          // Send to AI for entity interaction
          sendAIMessage({ text: content });

          // Also persist user message to R2
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId: activeChannelId,
              content,
              username: "You",
              type: "message",
            }),
          });
        } else {
          // Just add message to channel (no AI response)
          const message: Message = {
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
            username: "You",
            content,
            type: "message",
          };

          setMessageCache((prev) => ({
            ...prev,
            [activeChannelId]: [...(prev[activeChannelId] || []), message],
          }));

          // Persist message to R2
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId: activeChannelId,
              content,
              username: "You",
              type: "message",
            }),
          });
        }
      }

      setInput("");
    },
    [
      isStreaming,
      activeChannelId,
      channelState,
      users,
      handleCommandResult,
      sendAIMessage,
      isCurrentChannelQuery,
    ],
  );

  // Handle channel selection
  const handleChannelSelect = useCallback(
    async (channelId: string) => {
      // Mark current channel as read before switching
      if (activeChannelId !== channelId) {
        await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "mark_read",
            channelId: activeChannelId,
          }),
        });
      }

      setActiveChannelId(channelId);
      setShowChannels(false);

      // Refresh channel state to update unread counts
      const response = await fetch("/api/channels");
      const data = await response.json();
      if (data.success && data.data) {
        setChannelState(data.data);
      }
    },
    [activeChannelId],
  );

  // Handle locked channel click
  const handleLockedChannelClick = useCallback((channelId: string) => {
    // Show "channel is locked" message
    const message: Message = {
      id: `locked-${Date.now()}`,
      timestamp: new Date(),
      username: "***",
      content: `Channel #${channelId} is locked.`,
      type: "system",
    };

    setMessageCache((prev) => ({
      ...prev,
      [prev[channelId] ? channelId : "lobby"]: [
        ...(prev["lobby"] || []),
        message,
      ],
    }));
  }, []);

  // Handle keyboard show/hide for iOS (native only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let showListener:
      | Promise<import("@capacitor/core").PluginListenerHandle>
      | undefined;
    let hideListener:
      | Promise<import("@capacitor/core").PluginListenerHandle>
      | undefined;

    const setupKeyboardListeners = async () => {
      const { Keyboard } = await import("@capacitor/keyboard");
      showListener = Keyboard.addListener("keyboardWillShow", (info) => {
        setKeyboardHeight(info.keyboardHeight);
      });
      hideListener = Keyboard.addListener("keyboardWillHide", () => {
        setKeyboardHeight(0);
      });
    };

    setupKeyboardListeners();

    return () => {
      showListener?.then((handle) => handle.remove());
      hideListener?.then((handle) => handle.remove());
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages, isStreaming]);

  useEffect(() => {
    if (keyboardHeight > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [keyboardHeight]);

  // Format current time for status bar
  const formatStatusTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [statusTime, setStatusTime] = useState(formatStatusTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusTime(formatStatusTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get display name for current channel
  const channelDisplayName = useMemo(() => {
    if (isCurrentChannelQuery && activeChannel) {
      return `[${(activeChannel as { targetUsername?: string }).targetUsername || "Query"}]`;
    }
    return `#${activeChannel?.name || "lobby"}`;
  }, [activeChannel, isCurrentChannelQuery]);

  return (
    <div
      className="flex flex-col w-screen overflow-hidden bg-irc-bg safe-area-top transition-[height] duration-200"
      style={{
        height:
          keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight}px)` : "100vh",
      }}
    >
      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Mobile overlay for channels */}
        {showChannels && (
          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setShowChannels(false)}
            role="button"
            tabIndex={0}
            aria-label="Close channels sidebar"
            onKeyDown={(e) => e.key === "Escape" && setShowChannels(false)}
          />
        )}

        {/* Mobile overlay for users */}
        {showUsers && (
          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setShowUsers(false)}
            role="button"
            tabIndex={0}
            aria-label="Close users sidebar"
            onKeyDown={(e) => e.key === "Escape" && setShowUsers(false)}
          />
        )}

        {/* Channel sidebar */}
        <aside
          className={`fixed lg:relative inset-y-0 left-0 z-50 w-40 transform transition-transform duration-200 ease-in-out lg:transform-none border-r border-irc-border ${
            showChannels
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <ChannelList
            channels={channelListItems}
            queryWindows={queryWindowItems}
            activeChannelId={activeChannelId}
            onChannelSelect={handleChannelSelect}
            onLockedChannelClick={handleLockedChannelClick}
            onClose={() => setShowChannels(false)}
          />
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-1 py-1">
            {loadingChannel && (
              <div className="flex leading-snug">
                <span className="text-irc-timestamp">[{statusTime}]</span>
                <span className="w-24 text-right shrink-0 px-1 text-irc-timestamp">
                  --
                </span>
                <span className="text-irc-timestamp animate-pulse">
                  Loading...
                </span>
              </div>
            )}

            {allMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex leading-snug">
                <span className="text-irc-timestamp">[{statusTime}]</span>
                <span className="w-24 text-right shrink-0 px-1 text-irc-magenta">
                  --
                </span>
                <span className="text-irc-timestamp animate-pulse">
                  {entityName} is typing...
                </span>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="flex leading-snug">
                <span className="text-irc-timestamp">[{statusTime}]</span>
                <span className="w-24 text-right shrink-0 px-1 text-irc-red">
                  !!
                </span>
                <span className="text-irc-red">Error: {error.message}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            input={input}
            onInputChange={(e) => setInput(e.target.value)}
            onSendMessage={handleSendMessage}
            channelName={
              isCurrentChannelQuery
                ? (activeChannel as { targetUsername?: string })
                    ?.targetUsername || "Query"
                : activeChannel?.name || "lobby"
            }
            keyboardVisible={keyboardHeight > 0}
            disabled={isStreaming}
          />
        </main>

        {/* User sidebar */}
        <aside
          className={`fixed lg:relative inset-y-0 right-0 z-50 w-32 transform transition-transform duration-200 ease-in-out lg:transform-none border-l border-irc-border ${
            showUsers ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
        >
          <UserList users={users} onClose={() => setShowUsers(false)} />
        </aside>
      </div>

      {/* Status bar - WeeChat style */}
      <div className="flex items-center justify-between px-2 py-0.5 bg-irc-sidebar-bg border-t border-irc-border text-xs">
        {/* Left: time and network info */}
        <div className="flex items-center gap-2">
          <span className="text-irc-timestamp">[{statusTime}]</span>
          <span className="text-irc-timestamp">[</span>
          <span className="text-irc-green">AnomaNet</span>
          <span className="text-irc-timestamp">]</span>
          <span
            className={
              isCurrentChannelQuery ? "text-irc-magenta" : "text-irc-cyan"
            }
          >
            {channelDisplayName}
          </span>
          {!isCurrentChannelQuery && (
            <span className="text-irc-timestamp">(+cnt)</span>
          )}
        </div>

        {/* Center: channel activity indicators */}
        <div className="hidden md:flex items-center gap-1">
          {channelListItems
            .filter((ch) => !ch.hidden)
            .map((ch, i, arr) => (
              <span
                key={ch.id}
                className={
                  ch.unreadCount > 0
                    ? "text-irc-highlight"
                    : ch.id === activeChannelId
                      ? "text-irc-bright-white"
                      : "text-irc-timestamp"
                }
              >
                {i + 1}
                {ch.unreadCount > 0 && `(${ch.unreadCount})`}
                {i < arr.length - 1 && ","}
              </span>
            ))}
        </div>

        {/* Right: mobile menu buttons */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setShowChannels(true)}
            className="text-irc-cyan hover:text-irc-bright-white"
          >
            [ch]
          </button>
          <button
            onClick={() => setShowUsers(true)}
            className="text-irc-cyan hover:text-irc-bright-white"
          >
            [usr]
          </button>
        </div>

        {/* Right: user count (desktop) */}
        <div className="hidden lg:block text-irc-timestamp">
          {users.filter((u) => u.status === "online").length}/{users.length}{" "}
          users
        </div>
      </div>
    </div>
  );
}
