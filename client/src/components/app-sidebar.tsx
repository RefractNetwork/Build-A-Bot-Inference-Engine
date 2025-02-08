import info from "@/lib/info.json";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink, useLocation } from "react-router";
import ConnectionStatus from "./connection-status";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

import { Beaker, ShoppingBag } from "lucide-react";

export function AppSidebar() {
    const location = useLocation();
    const account = useCurrentAccount();

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <NavLink to="/">
                                <div className="bg-white rounded-full p-2">
                                    <img
                                        alt="refract-icon"
                                        src="/refract.png"
                                        width="90%"
                                        height="90%"
                                        className="size-7"
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">
                                        Refract Eliza
                                    </span>
                                    <span className="">v{info?.version}</span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <NavLink to="/build">
                                    <SidebarMenuButton
                                        isActive={location.pathname.includes(
                                            "build"
                                        )}
                                    >
                                        <Beaker />
                                        <span>Build a Bear</span>
                                    </SidebarMenuButton>
                                </NavLink>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <NavLink to="/marketplace">
                                    <SidebarMenuButton
                                        isActive={location.pathname.includes(
                                            "marketplace"
                                        )}
                                    >
                                        <ShoppingBag />
                                        <span>Marketplace</span>
                                    </SidebarMenuButton>
                                </NavLink>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <div className="p-4 border-t border-gray-700">
                        {account ? (
                            <div className="flex items-center justify-between">
                                <ConnectButton />
                            </div>
                        ) : (
                            <ConnectButton />
                        )}
                    </div>
                    <ConnectionStatus />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
