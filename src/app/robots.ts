import { MetadataRoute } from "next";
import { segments } from "@/config/segments";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: `${segments.home}`,
        disallow: [
          `${segments.workspace.home}`,
          `${segments.workspace.calendar}`,
          `${segments.workspace.chat}`,
          `${segments.workspace.pricing}`,
          `${segments.workspace.integrations}`,
          `${segments.workspace.settings}`,
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
