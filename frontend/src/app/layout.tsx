import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-handwriting" });

export const metadata: Metadata = {
  title: "Vellon AI | Smart Notes & AI Summaries",
  description:
    "Vellon AI helps you capture notes, get AI summaries and keywords, and find anything in seconds. Your data stays yours.",
  keywords: ["Vellon AI", "smart notes", "AI notes", "note taking", "AI summaries"],
  openGraph: {
    type: "website",
    title: "Vellon AI | Smart Notes & AI Summaries",
    description:
      "Vellon AI helps you capture notes, get AI summaries and keywords, and find anything in seconds. Your data stays yours.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vellon AI | Smart Notes & AI Summaries",
    description:
      "Vellon AI helps you capture notes, get AI summaries and keywords, and find anything in seconds. Your data stays yours.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${caveat.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
