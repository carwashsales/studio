
"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
    Users,
    CircleDollarSign
} from "lucide-react";
import { useTranslations } from "next-intl";

const navItems = [
    { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/inventory", labelKey: "inventory", icon: Package },
    { href: "/orders", labelKey: "orders", icon: ShoppingCart },
    { href: "/sales", labelKey: "sales", icon: CircleDollarSign },
    { href: "/pricing", labelKey: "pricing", icon: Tag },
    { href: "/reports", labelKey: "reports", icon: FileText },
    { href: "/staff", labelKey: "staff", icon: Users },
];

export default function SidebarNav() {
    const pathname = usePathname();
    const t = useTranslations('Sidebar');

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
                                tooltip={{children: t(item.labelKey as any)}}
                                className="dark:data-[active=true]:bg-sidebar-accent"
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{t(item.labelKey as any)}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-2">
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{children: t('settings')}} isActive={pathname.includes('/settings')}>
                            <Link href="/settings">
                                <Settings />
                                <span>{t('settings')}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{children: t('support')}} isActive={pathname.includes('/support')}>
                            <Link href="/support">
                                <HelpCircle />
                                <span>{t('support')}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
