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
import Cookies from "js-cookie";

import { Beaker, MessageSquare, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export function AppSidebar() {
    const location = useLocation();
    const account = useCurrentAccount();
    const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
    const [currentMemoryId, setCurrentMemoryId] = useState<string | null>(null);

    // Check for active chat session and memory module on component mount
    useEffect(() => {
        // Look through cookies for the most recently created agent
        const cookies = Object.keys(Cookies.get())
            .filter((key) => key.startsWith("agent_"))
            .reduce((acc: { [key: string]: any }, key) => {
                if (key.endsWith("_created")) {
                    const id = key.split("_")[1];
                    acc[id] = {
                        ...acc[id],
                        timestamp: parseInt(Cookies.get(key) || "0"),
                    };
                } else if (key.endsWith("_memory")) {
                    const id = key.split("_")[1];
                    acc[id] = {
                        ...acc[id],
                        memoryId: Cookies.get(key),
                    };
                }
                return acc;
            }, {});

        // Find the most recent agent with a memory module
        const recentAgent = Object.entries(cookies)
            .filter(([_, data]) => data.timestamp && data.memoryId)
            .sort(([_, a], [__, b]) => b.timestamp - a.timestamp)[0];

        if (recentAgent) {
            const [agentId, data] = recentAgent;
            setCurrentAgentId(agentId);
            setCurrentMemoryId(data.memoryId);
        }
    }, []);

    return (
        <Sidebar className="hidden md:flex">
            {" "}
            {/* Hide on mobile */}
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
                            {currentAgentId && currentMemoryId && (
                                <SidebarMenuItem>
                                    <NavLink
                                        to={`/chat/${currentAgentId}?moduleId=${currentMemoryId}`}
                                    >
                                        <SidebarMenuButton
                                            isActive={location.pathname.includes(
                                                "chat"
                                            )}
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
                                        isActive={location.pathname.includes(
                                            "build"
                                        )}
                                    >
                                        <Beaker />
                                        <span>Build a Bot</span>
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
