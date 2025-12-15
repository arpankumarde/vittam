import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vittam - AI-Driven Sales Automation for NBFCs",
  description: "Accelerate personal loan sales from days to minutes with Vittam's multi-agent AI system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          {children}
          {/* ---- Chat Widget Shim ---- */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.process = window.process || { env: {} };
            `,
          }}
        />

        {/* ---- Chat Widget Script ---- */}
        <script
          src="http://localhost:5173/chat-widget.js"
          data-bot-id="acme"
          data-position="bottom-right"
          data-width="360"
          data-height="520"
          defer
        />
        </main>
        <Footer />
        <Toaster position="top-center" richColors theme="light" />
      </body>
    </html>
  );
}
