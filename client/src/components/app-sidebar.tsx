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

const CURRENT_CHAT_COOKIE = "current_chat";

export function AppSidebar() {
    const location = useLocation();
    const account = useCurrentAccount();
    const [currentChat, setCurrentChat] = useState<{
        agentId: string;
        moduleId: string;
    } | null>(null);

    // Check for active chat session on component mount
    useEffect(() => {
        const savedChat = Cookies.get(CURRENT_CHAT_COOKIE);
        if (savedChat) {
            try {
                setCurrentChat(JSON.parse(savedChat));
            } catch (error) {
                console.error("Failed to parse current chat cookie:", error);
            }
        }
    }, []);

    return (
        <Sidebar className="hidden md:flex">
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
                            {currentChat && (
                                <SidebarMenuItem>
                                    <NavLink
                                        to={`/chat/${currentChat.agentId}?moduleId=${currentChat.moduleId}`}
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
