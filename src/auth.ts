import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import { db } from "./lib/db";
import { linkedAccounts, users } from "./lib/db/schema";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
	  scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      allowDangerousEmailAccountLinking: true
    })
  ],
  callbacks: {
    async jwt({token,account}) {
      // console.log("JWT");
      // console.log(token);
      // console.log(account);
      if(account) {
	const cs = await auth();
	if(cs?.user) {
	  // Primary Email in use
	  console.log("Using existing primary details");
	  token.email=cs.user.email;
	  token.accessToken=cs.accessToken;
	  token.name=cs.user.name;
	}else {
	  token.accessToken = account.access_token;
	  token.refreshToken = account.refresh_token;
	  token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : 0;
	}
      }
      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID as string,
              client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });

          const refreshedTokens = await response.json();

          if (!response.ok) throw refreshedTokens;

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }
      return token;
    },
    async session({ session, token}) {
      // console.log("Session Updated ");
      // console.log(session);
      // console.log(token);
      session.accessToken=token.accessToken;
      session.error = token.error as string;
      session.user.name=token.name;
      return session;
    },
    async signIn({user, account, profile}) {
      // get Current Session
      const currentSession = await auth();
      if(currentSession?.user.email) {
	//== Adding More Emails ==
	console.log("Adding more emails to primary email: "+currentSession.user.email);
	console.log("Storing Additional Email: "+profile?.email+", "+profile?.email);
	await db.insert(linkedAccounts).values({primaryEmail:currentSession.user.email,email:profile?.email,accessToken:account?.access_token,refreshToken:account?.refresh_token,expiresAt:account?.expires_at,name:profile?.name, image:user.image});

      }else {
	console.log("Primary Email SignIn: "+profile?.email);

	let primaryUser = await db.select().from(users).where(eq(users.email,profile?.email!));
	if(primaryUser.length==0) {
	  console.log("Adding Primary Email to DB");
	  try {
	    await db.insert(users).values({email:profile?.email,name:profile?.name,createdAt:Date.now()});
	    console.log("Primary Email Added to DB");
	  }catch(e) {
	    console.error("Failure to add Primary Email to DB, error: "+e);
	  }
	}else {
	  console.log("Signing In to "+user.email);
	}
      }
      return true;
    },
  }
})
export const { handlers, auth, signIn, signOut } = handler
