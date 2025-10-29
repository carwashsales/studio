'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Mail, MessageSquare } from 'lucide-react';
import Link from "next/link";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import SidebarNav from "@/components/sidebar-nav";
import Header from "@/components/header";

function SupportPageContent() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <div>Loading...</div>;
    }

    const email = "banksray206@gmail.com";
    const whatsappNumber = "256708390617";
    const emailSubject = "Support Request for CleanSweep App";
    const emailBody = "Hello, I need assistance with the following issue: ";
    const whatsappMessage = "Hello, I need support for the CleanSweep app.";

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Support</CardTitle>
                <CardDescription>
                    Get help and support for your application.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>If you need help or have any questions, please feel free to reach out to us through one of the methods below. We're here to help!</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href={mailtoLink} className="w-full">
                        <Button variant="outline" className="w-full h-16 text-lg">
                            <Mail className="mr-3 h-6 w-6" />
                            Email Support
                        </Button>
                    </Link>
                    <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button variant="outline" className="w-full h-16 text-lg">
                            <MessageSquare className="mr-3 h-6 w-6" />
                            Chat on WhatsApp
                        </Button>
                    </Link>
                </div>

                <div className="pt-4 text-sm text-muted-foreground">
                    <p>
                        <strong>Email:</strong> {email}
                    </p>
                    <p>
                        <strong>WhatsApp:</strong> +256 708 390617
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function SupportPage() {
    return (
        <SidebarProvider>
            <SidebarNav />
            <SidebarInset>
                <Header />
                <main className="p-4 sm:p-6 lg:p-8">
                    <SupportPageContent />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
