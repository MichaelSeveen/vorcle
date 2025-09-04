import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL as string,
  plugins: [polarClient()],
});

export const {
  signIn,
  signOut,
  linkSocial,
  useSession,
  getSession,
  checkout,
  customer,
} = authClient;
