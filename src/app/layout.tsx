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
  title: "RAW Cloud Linux - Free Plan Terminal",
  description: "بيئة نظام لينكس السحابية من RAW - الخطة المجانية",
  keywords: ["RAW", "Linux", "Cloud", "Terminal", "VPS", "Free Plan"],
  authors: [{ name: "RAW Cloud" }],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-[#e0e0e0]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
