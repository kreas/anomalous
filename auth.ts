import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Discord],
  callbacks: {
    jwt({ token, profile }) {
      // Store Discord avatar in token
      if (profile) {
        token.discordAvatar = profile.image_url as string | undefined;
        token.discordUsername = profile.username as string | undefined;
      }
      return token;
    },
    session({ session, token }) {
      // Include Discord user ID and avatar in session
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.discordAvatar) {
        session.user.discordAvatar = token.discordAvatar as string;
      }
      if (token.discordUsername) {
        session.user.discordUsername = token.discordUsername as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

// Extend next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordAvatar?: string;
      discordUsername?: string;
    };
  }

  interface JWT {
    discordAvatar?: string;
    discordUsername?: string;
  }
}
