import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cog, Trash2 } from "lucide-react";
import PageTitle from "@/components/page-title";
import { apiClient } from "@/lib/api";
import { NavLink } from "react-router";
import type { UUID } from "@elizaos/core";
import { formatAgentName } from "@/lib/utils";
import { CreateAgentDialog } from "@/components/ui/create-agent-dialog";

export default function Home() {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    const deleteAgentMutation = useMutation({
        mutationFn: (agentId: string) => apiClient.delete(`/agents/${agentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
        },
    });

    const agents = query?.data?.agents;

    const handleDelete = (agentId: string, agentName: string) => {
        if (window.confirm(`Are you sure you want to delete ${agentName}?`)) {
            deleteAgentMutation.mutate(agentId);
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full p-4 bg-gray-950">
            <PageTitle title="Agents" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CreateAgentDialog />
                {agents?.map((agent: { id: UUID; name: string }) => (
                    <div
                        key={agent.id}
                        className="border border-gray-700 bg-gray-900 rounded-lg"
                    >
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-100">
                                {agent?.name}
                            </h3>
                            <button
                                onClick={() =>
                                    handleDelete(agent.id, agent.name)
                                }
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-lg transition-colors"
                                title="Delete agent"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="rounded bg-gray-800 aspect-square w-full grid place-items-center">
                                <div className="text-6xl font-bold uppercase text-gray-400">
                                    {formatAgentName(agent?.name)}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 flex items-center gap-4 border-t border-gray-700">
                            <NavLink
                                to={`/chat/${agent.id}`}
                                className="flex-grow"
                            >
                                <button className="w-full px-4 py-2 border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-800 transition-colors">
                                    Chat
                                </button>
                            </NavLink>
                            <NavLink to={`/settings/${agent.id}`}>
                                <button className="p-2 border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-800 transition-colors">
                                    <Cog className="h-5 w-5" />
                                </button>
                            </NavLink>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
