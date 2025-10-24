import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import SidebarNav from "@/components/sidebar-nav";
import Header from "@/components/header";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "CleanSweep Inventory",
  description: "Inventory management for car wash supplies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <Toaster />
          <SidebarProvider>
              <SidebarNav />
              <SidebarInset>
                <Header />
                <div className="p-4 sm:p-6 lg:p-8">
                  {children}
                </div>
              </SidebarInset>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
