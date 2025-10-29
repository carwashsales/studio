'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const handleLogout = async () => {
        if (auth) {
          setIsLoggingOut(true);
          await signOut(auth);
          router.push('/login');
          // No need to set isLoggingOut back to false, as we are navigating away
        }
    };

    if (isUserLoading || !user) {
        return <div>Loading...</div>;
    }
    
    return (
        <Card className="max-w-xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline">Account Settings</CardTitle>
                <CardDescription>
                    Manage your account and application settings here.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user?.photoURL ?? undefined} alt="User Avatar" />
                        <AvatarFallback className="text-2xl">{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <p className="text-lg font-semibold">{user.displayName || 'User'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <div>
                    {/* More settings can be added here in the future */}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                 <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                </Button>
            </CardFooter>
        </Card>
    )
}
