import { useParams, useSearchParams } from "react-router";
import Chat from "@/components/chat";
import type { UUID } from "@elizaos/core";

export default function AgentRoute() {
    const { agentId } = useParams<{ agentId: UUID }>();
    const [searchParams] = useSearchParams();
    const moduleId = searchParams.get('moduleId');

    if (!agentId || !moduleId) return <div>Missing required parameters.</div>;

    return <Chat agentId={agentId} moduleId={moduleId} />;
}
