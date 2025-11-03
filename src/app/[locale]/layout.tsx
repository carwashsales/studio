import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import SidebarNav from "@/components/sidebar-nav";
import Header from "@/components/header";
import * as React from "react";
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from "next-intl";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const messages = await getMessages();
    
    return (
        <NextIntlClientProvider messages={messages}>
            <SidebarProvider>
                <SidebarNav />
                <SidebarInset>
                    <Header />
                    <main className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </NextIntlClientProvider>
    );
}
