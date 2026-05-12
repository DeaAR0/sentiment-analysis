import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shared/Sidebar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SentinelAI — Brand Intelligence Platform",
  description: "AI-powered sentiment analysis and brand reputation monitoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-slate-50 antialiased`}>
        <div className="flex min-h-screen print:block print:min-h-0">
          <Sidebar />
          <main className="flex-1 overflow-auto print:w-full print:overflow-visible">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
