import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import SidebarNav from "@/components/sidebar-nav";
import Header from "@/components/header";
import * as React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <SidebarNav />
            <SidebarInset>
                <Header />
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
