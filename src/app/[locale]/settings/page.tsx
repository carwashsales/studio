
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { LogOut, Moon, Sun, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const { theme, setTheme } = useTheme();
    const [photoURL, setPhotoURL] = React.useState(user?.photoURL || '');

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
        if (user?.photoURL) {
            setPhotoURL(user.photoURL);
        }
    }, [user, isUserLoading, router]);

    const handleLogout = async () => {
        if (auth) {
          setIsLoggingOut(true);
          await signOut(auth);
          router.push('/login');
        }
    };

    const handleProfileUpdate = async () => {
        if (auth?.currentUser) {
            try {
                await updateProfile(auth.currentUser, { photoURL: photoURL });
                toast({
                    title: "Profile Updated",
                    description: "Your profile picture has been updated successfully.",
                });
                // Force a re-render or state update if needed, though onAuthStateChanged should handle it
                router.refresh(); 
            } catch (error) {
                console.error("Error updating profile:", error);
                toast({
                    variant: 'destructive',
                    title: "Update Failed",
                    description: "Could not update your profile picture.",
                });
            }
        }
    };

    const handleClearData = async () => {
        if (!firestore || !user) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not clear data. User not authenticated.'
            });
            return;
        }

        const collectionsToClear = ['inventory', 'orders', 'sales', 'staff', 'services'];
        const batch = writeBatch(firestore);

        try {
            for (const colName of collectionsToClear) {
                const colRef = collection(firestore, 'users', user.uid, colName);
                const snapshot = await getDocs(colRef);
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }
            await batch.commit();
            toast({
                title: 'Data Cleared',
                description: 'All your application data has been successfully cleared.',
            });
        } catch (error) {
            console.error("Error clearing data:", error);
            toast({
                variant: 'destructive',
                title: 'Error Clearing Data',
                description: 'An error occurred while trying to clear your data.',
            });
        }
    };

    if (isUserLoading || !user) {
        return <div>Loading...</div>;
    }
    
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Account</CardTitle>
                    <CardDescription>
                        Manage your account details.
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
                </CardContent>
                <CardFooter className="flex justify-end">
                     <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Profile Picture</CardTitle>
                    <CardDescription>Update your profile picture by providing an image URL.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <Label htmlFor="photo-url">Image URL</Label>
                        <Input
                            id="photo-url"
                            placeholder="https://example.com/image.png"
                            value={photoURL}
                            onChange={(e) => setPhotoURL(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleProfileUpdate}>Save Profile Picture</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Appearance</CardTitle>
                    <CardDescription>
                        Customize the look and feel of the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="theme-switcher" className="flex items-center gap-2">
                           {theme === 'light' ? <Sun /> : <Moon />}
                            <span>Light / Dark Mode</span>
                        </Label>
                        <Switch
                            id="theme-switcher"
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Notifications</CardTitle>
                    <CardDescription>
                        Notification settings for low inventory alerts are coming soon.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic">Feature in development.</p>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="font-headline text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        These actions are permanent and cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear All Application Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete all your inventory, sales, orders, and staff data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearData}>
                                    Yes, delete all data
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

        </div>
    )
}
