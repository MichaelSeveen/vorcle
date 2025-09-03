import "server-only";

import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return session.user;
});
