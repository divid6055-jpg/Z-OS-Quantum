import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Z-OS 3.0 Quantum - Next-Gen Operating System",
  description: "Z-OS Quantum - نظام التشغيل الذي يتفوق على لينكس في كل شيء",
  keywords: ["Z-OS", "Quantum", "Linux", "Operating System", "Security", "AI"],
  authors: [{ name: "Z-OS Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0e17] text-[#e0e8f0]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}