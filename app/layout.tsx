import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Loading from "./loading";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Data Ingestion Tool",
  description: "Data ingestion and processing platform with human-in-the-loop validation.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
          <Toaster richColors={true} position="top-right"/>
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
