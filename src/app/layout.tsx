import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkSystemStatus } from "@/server/actions/setup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ogodo, Ogodo & Co. - Property Manager",
  description: "Property Management System by Ogodo, Ogodo & Co.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // Check system initialization status
  // We use headers to get the path because this is a Server Component
  // and we want to avoid Edge Runtime DB issues in Middleware
  const headersList = await headers();
  const pathname = headersList.get("x-current-path");

  // Only perform check active pages (not static assets)
  if (
    pathname &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/static")
  ) {
    try {
      const { isInitialized } = await checkSystemStatus();

      // If system is NOT initialized and we are NOT on setup page -> Go to Setup
      if (!isInitialized && pathname !== "/setup") {
        redirect("/setup");
      }

      // If system IS initialized and we ARE on setup page -> Go to Login
      if (isInitialized && pathname === "/setup") {
        redirect("/login");
      }
    } catch (error) {
      console.error("Failed to check system status in layout:", error);
      // In case of DB error, we don't block access, but setup might fail anyway
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster richColors closeButton />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
