import { Inngest } from "inngest";

export const inngest = new Inngest({
	id: "vorcle",
	isDev: process.env.NODE_ENV !== "production",
});
