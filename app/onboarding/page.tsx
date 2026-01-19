"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { validateNickname } from "@/lib/profile";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Check if already onboarded
  useEffect(() => {
    async function checkProfile() {
      if (status !== "authenticated") return;

      const res = await fetch("/api/profile");
      const data = await res.json();

      if (data.profile?.onboardingComplete) {
        router.push("/");
      }
    }

    checkProfile();
  }, [status, router]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);

    if (value.length > 0) {
      const validation = validateNickname(value);
      setError(validation.error || "");
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateNickname(nickname);
    if (!validation.valid) {
      setError(validation.error || "Invalid nickname");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create profile");
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to home
      router.push("/");
    } catch {
      setError("Failed to create profile");
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-irc-bg flex items-center justify-center">
        <div className="text-irc-cyan font-mono">Loading...</div>
      </div>
    );
  }

  const avatarUrl = session?.user?.image || session?.user?.discordAvatar;
  const discordName = session?.user?.discordUsername || session?.user?.name;

  return (
    <div className="min-h-screen bg-irc-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="border border-irc-border bg-irc-sidebar-bg p-4 mb-4">
          <div className="text-irc-cyan text-center font-mono text-lg">
            PROFILE CONFIGURATION
          </div>
        </div>

        {/* Profile setup */}
        <div className="border border-irc-border bg-irc-sidebar-bg p-6">
          {/* System messages */}
          <div className="text-irc-system text-sm mb-4 font-mono">
            <span className="text-irc-timestamp">[SYSTEM]</span>{" "}
            <span className="text-irc-green">Connection established</span>
          </div>

          <div className="text-irc-system text-sm mb-6 font-mono">
            <span className="text-irc-timestamp">[SYSTEM]</span>{" "}
            <span className="text-irc-white">
              Configure your network identity before proceeding
            </span>
          </div>

          {/* Avatar display */}
          <div className="flex items-center gap-4 mb-6 p-3 bg-irc-input-bg border border-irc-border">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Discord avatar" className="w-16 h-16" />
            ) : (
              <div className="w-16 h-16 bg-irc-border flex items-center justify-center text-irc-timestamp">
                ?
              </div>
            )}
            <div className="font-mono">
              <div className="text-irc-timestamp text-xs">DISCORD IDENTITY</div>
              <div className="text-irc-white">{discordName || "Unknown"}</div>
              <div className="text-irc-timestamp text-xs mt-1">
                Avatar synced from Discord
              </div>
            </div>
          </div>

          {/* Nickname form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-irc-timestamp text-xs mb-2 font-mono">
                NETWORK NICKNAME (2-12 characters)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  maxLength={12}
                  placeholder="Enter nickname..."
                  className="flex-1 bg-irc-input-bg border border-irc-border text-irc-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-irc-cyan"
                  disabled={isSubmitting}
                  autoFocus
                />
                <span className="text-irc-timestamp text-xs self-center font-mono min-w-[3rem] text-right">
                  {nickname.length}/12
                </span>
              </div>
              {error && (
                <div className="text-irc-red text-xs mt-2 font-mono">
                  {error}
                </div>
              )}
            </div>

            <div className="text-irc-timestamp text-xs mb-4 font-mono">
              Must start with a letter. Letters, numbers, underscores, and
              hyphens only.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !nickname || !!error}
              className="w-full bg-irc-cyan text-irc-bg py-2 px-4 font-mono text-sm hover:bg-irc-bright-white disabled:bg-irc-border disabled:text-irc-timestamp transition-colors"
            >
              {isSubmitting ? "CONFIGURING..." : "COMPLETE SETUP"}
            </button>
          </form>
        </div>

        {/* Status bar */}
        <div className="border border-t-0 border-irc-border bg-irc-input-bg px-4 py-2">
          <div className="text-irc-timestamp text-xs font-mono">
            <span className="text-irc-yellow">●</span> Profile configuration
            required
          </div>
        </div>
      </div>
    </div>
  );
}
