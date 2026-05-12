import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const getCurrentUser = async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return session?.user ?? null;
};
