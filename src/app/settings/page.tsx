'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function SettingsPage() {
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
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Settings</CardTitle>
                <CardDescription>
                    Manage your account and application settings here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Settings content will go here.</p>
            </CardContent>
        </Card>
    )
}