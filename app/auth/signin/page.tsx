"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSignIn = () => {
    signIn("discord", { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-irc-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Terminal header */}
        <div className="border border-irc-border bg-irc-sidebar-bg p-4 mb-4">
          <div className="text-irc-cyan text-center">
            <pre className="text-xs leading-tight">
              {`
 █████╗ ███╗   ██╗ ██████╗ ███╗   ███╗ █████╗ ██╗  ██╗   ██╗
██╔══██╗████╗  ██║██╔═══██╗████╗ ████║██╔══██╗██║  ╚██╗ ██╔╝
███████║██╔██╗ ██║██║   ██║██╔████╔██║███████║██║   ╚████╔╝
██╔══██║██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██║██║    ╚██╔╝
██║  ██║██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██║  ██║███████╗██║
╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝
`}
            </pre>
          </div>
        </div>

        {/* Connection box */}
        <div className="border border-irc-border bg-irc-sidebar-bg p-6">
          <div className="text-irc-system text-sm mb-4 font-mono">
            <span className="text-irc-timestamp">[SYSTEM]</span>{" "}
            <span className="text-irc-white">
              Authentication required to access sh.ghost.gs
            </span>
          </div>

          <div className="text-irc-system text-sm mb-6 font-mono">
            <span className="text-irc-timestamp">[SYSTEM]</span>{" "}
            <span className="text-irc-white">
              Secure connection via Discord identity verification
            </span>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 px-4 font-mono text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            CONNECT WITH DISCORD
          </button>

          <div className="mt-6 text-irc-timestamp text-xs text-center font-mono">
            By connecting, you agree to the network terms of service
          </div>
        </div>

        {/* Status bar */}
        <div className="border border-t-0 border-irc-border bg-irc-input-bg px-4 py-2">
          <div className="text-irc-timestamp text-xs font-mono">
            <span className="text-irc-green">●</span> sh.ghost.gs v1.0 | Secure
            Connection Required
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-irc-bg flex items-center justify-center">
          <div className="text-irc-cyan font-mono">Loading...</div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
