'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function SupportPage() {
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
                <CardTitle className="font-headline">Support</CardTitle>
                <CardDescription>
                    Get help and support for your application.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Support content will go here. Contact us at support@example.com.</p>
            </CardContent>
        </Card>
    )
}