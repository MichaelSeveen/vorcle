import type { MetadataRoute } from "next";
import { segments } from "@/config/segments";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: `${process.env.NEXT_PUBLIC_APP_URL}${segments.home}`,
			priority: 1,
		},
		{
			url: `${process.env.NEXT_PUBLIC_APP_URL}${segments.signIn}`,
		},
	];
}
