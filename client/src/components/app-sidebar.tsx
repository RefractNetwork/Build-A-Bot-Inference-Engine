import { useQuery } from "@tanstack/react-query";
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
    SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { apiClient } from "@/lib/api";
import { NavLink, useLocation } from "react-router";
import type { UUID } from "@elizaos/core";
import { User } from "lucide-react";
import ConnectionStatus from "./connection-status";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function AppSidebar() {
    const location = useLocation();
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    const agents = query?.data?.agents;

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
            <div className="mt-auto p-4 border-t border-gray-700">
                {account ? (
                    <div className="flex items-center justify-between">
                        <ConnectButton />
                    </div>
                ) : (
                    <ConnectButton />
                )}
            </div>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Agents</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {query?.isPending ? (
                                <div>
                                    {Array.from({ length: 5 }).map(
                                        (_, _index) => (
                                            <SidebarMenuItem
                                                key={"skeleton-item"}
                                            >
                                                <SidebarMenuSkeleton />
                                            </SidebarMenuItem>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {agents?.map(
                                        (agent: { id: UUID; name: string }) => (
                                            <SidebarMenuItem key={agent.id}>
                                                <NavLink
                                                    to={`/chat/${agent.id}`}
                                                >
                                                    <SidebarMenuButton
                                                        isActive={location.pathname.includes(
                                                            agent.id
                                                        )}
                                                    >
                                                        <User />
                                                        <span>
                                                            {agent.name}
                                                        </span>
                                                    </SidebarMenuButton>
                                                </NavLink>
                                            </SidebarMenuItem>
                                        )
                                    )}
                                </div>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    {/* <SidebarMenuItem> */}
                    {/*     <NavLink */}
                    {/*         to="https://elizaos.github.io/eliza/docs/intro/" */}
                    {/*         target="_blank" */}
                    {/*     > */}
                    {/*         <SidebarMenuButton> */}
                    {/*             <Book /> Documentation */}
                    {/*         </SidebarMenuButton> */}
                    {/*     </NavLink> */}
                    {/* </SidebarMenuItem> */}
                    {/* <SidebarMenuItem> */}
                    {/*     <SidebarMenuButton disabled> */}
                    {/*         <Cog /> Settings */}
                    {/*     </SidebarMenuButton> */}
                    {/* </SidebarMenuItem> */}
                    <ConnectionStatus />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
