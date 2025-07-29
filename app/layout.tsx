import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeDebate - Sharpen Your Debate Skills",
  description: "A platform for practicing and improving your debate skills with real-time feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} WeDebate. All rights reserved.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
