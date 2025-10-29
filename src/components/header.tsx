'use client';

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  }

  const handleRegister = () => {
    router.push('/register');
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-8">
       <div className="block md:hidden">
          <SidebarTrigger />
        </div>
      <div className="flex w-full items-center gap-4 md:gap-8">
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-xl font-headline">Dashboard</h1>
        </div>
        {isUserLoading ? (
            <Avatar className="h-9 w-9">
                <AvatarFallback>?</AvatarFallback>
            </Avatar>
        ) : user ? (
            <Link href="/settings">
                <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={user?.photoURL ?? undefined} alt="User Avatar" />
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
            </Link>
        ) : (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={handleLogin}>
                    <span>Login</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRegister}>
                    <span>Register</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
