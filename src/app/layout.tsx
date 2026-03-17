import type { Metadata } from "next";
import { Newsreader, Public_Sans } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600", "700"],
});

const sans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Alaska Rural Health Transformation Navigator",
  description:
    "Editorial policy microsite, investment calculator, and assumptions workspace for sequencing diabetic eye screening investments across Alaska.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <div className="relative min-h-screen">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-[100rem] flex-col gap-10 px-4 py-8 md:px-8 lg:px-12">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
