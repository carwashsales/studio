"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Tag,
    FileText,
    Car,
    Settings,
    HelpCircle,
    Users
} from "lucide-react";
import Image from "next/image";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/orders", label: "Orders", icon: ShoppingCart },
    { href: "/sales", label: "Sales", icon: () => <Image src="/sarwhite1.png" alt="SAR" width={16} height={16} /> },
    { href: "/pricing", label: "Pricing", icon: Tag },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/staff", label: "Staff", icon: Users },
];

export default function SidebarNav() {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="dark:bg-background dark:border-r">
            <SidebarHeader className="h-14 flex items-center justify-center p-2">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg group-data-[collapsible=icon]:hidden text-primary">
                    <Car className="h-6 w-6 text-primary" />
                    <span className="font-headline">CleanSweep</span>
                </Link>
                 <Car className="h-6 w-6 text-primary hidden group-data-[collapsible=icon]:block" />
            </SidebarHeader>
            <SidebarContent className="flex-1 p-2">
                <SidebarMenu>
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={{children: item.label}}
                                className="dark:data-[active=true]:bg-sidebar-accent"
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-2">
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{children: "Settings"}}>
                            <Link href="#">
                                <Settings />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{children: "Support"}}>
                            <Link href="#">
                                <HelpCircle />
                                <span>Support</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
