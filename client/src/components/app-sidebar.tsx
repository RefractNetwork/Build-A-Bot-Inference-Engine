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
import Cookies from 'js-cookie';

import { Beaker, MessageSquare, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export function AppSidebar() {
    const location = useLocation();
    const account = useCurrentAccount();
    const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
    const MEMORY_MODULE_ID = "0x8d4e3c2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3";

    // Check for active chat session on component mount
    useEffect(() => {
        // Look through cookies for the most recently created agent
        const cookies = Object.keys(Cookies.get())
            .filter(key => key.startsWith('agent_') && key.endsWith('_created'))
            .map(key => ({
                id: key.split('_')[1],
                timestamp: parseInt(Cookies.get(key) || '0')
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

        if (cookies.length > 0) {
            setCurrentAgentId(cookies[0].id);
        }
    }, []);

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
                                    <span className="font-bold">
                                        Refract Eliza
                                    </span>
                                    <span className="mt-1">Build a Bot</span>

                                    {/* <span className="">v{info?.version}</span> */}
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
                            {currentAgentId && (
                                <SidebarMenuItem>
                                    <NavLink to={`/chat/${currentAgentId}?moduleId=${MEMORY_MODULE_ID}`}>
                                        <SidebarMenuButton
                                            isActive={location.pathname.includes("chat")}
                                        >
                                            <MessageSquare />
                                            <span>Current Chat</span>
                                        </SidebarMenuButton>
                                    </NavLink>
                                </SidebarMenuItem>
                            )}
                            <SidebarMenuItem>
                                <NavLink to="/build">
                                    <SidebarMenuButton
                                        isActive={location.pathname.includes("build")}
                                    >
                                        <Beaker />
                                        <span>Build a Bot</span>
                                    </SidebarMenuButton>
                                </NavLink>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <NavLink to="/marketplace">
                                    <SidebarMenuButton
                                        isActive={location.pathname.includes("marketplace")}
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
