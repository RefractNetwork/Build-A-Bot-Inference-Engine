// hooks/useOwnedModules.ts
// @ts-nocheck
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit";

const BAB_PACKAGE_ID =
    "0x74546358274f661bc5d1ec9f21665f6725f71634e9c943a0616e963ea976b9c4";

export function useOwnedModules() {
    const suiClient = useSuiClient();
    const account = useCurrentAccount();

    return useQuery({
        queryKey: ["owned-modules", account?.address],
        queryFn: async () => {
            if (!account?.address) return {};

            const moduleInstances = await suiClient.getOwnedObjects({
                owner: account.address,
                filter: {
                    StructType: `${BAB_PACKAGE_ID}::Core::ComposableModuleInstance`,
                },
                options: {
                    showContent: true,
                },
            });

            // Categorize modules by type
            const categorizedModules = moduleInstances.data.reduce(
                (acc: Record<string, any[]>, instance) => {
                    const content = instance.data?.content;
                    if (!content || content.dataType !== "moveObject")
                        return acc;

                    const fields = content.fields;
                    const type = fields.type.toLowerCase();

                    if (!acc[type]) {
                        acc[type] = [];
                    }

                    acc[type].push({
                        onChainId: fields.module_id,
                        instanceId: fields.id.id,
                        name: fields.name,
                        description: fields.description,
                        imageUrl: fields.url,
                        thumbnailUrl: fields.thumbnail_url,
                        type: type,
                    });

                    return acc;
                },
                {}
            );

            return categorizedModules;
        },
        enabled: !!account?.address,
    });
}
