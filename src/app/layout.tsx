import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default:
      "Vorcle | Summarize, Transcribe, Gain Smart Insights into Meetings",
    template:
      "%s | Vorcle | Summarize, Transcribe, Gain Smart Insights into Meetings",
  },
  description:
    "Transcripts, instant summaries, and searchable meeting history — plus calendar sync and reminders to keep your team moving.",
  keywords: [
    "AI Teammate",
    "AI Agent",
    "AI meeting assistant",
    "AI meeting notes",
    "AI meeting summary",
    "AI meeting transcription",
    "AI meeting minutes",
    "AI meeting recorder",
  ],
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            {children}
            <Toaster richColors />
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
