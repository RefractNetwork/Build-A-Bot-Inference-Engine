import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { UploadModuleDialog } from "@/components/upload-module-dialog";
import { MarketplaceModule } from "@/types/marketplace";
import { MarketplaceModuleCard } from "@/components/marketplace-module-card";
import { apiClient } from "@/lib/api";

export default function Marketplace() {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const account = useCurrentAccount();

    const suiClient = useSuiClient();

    const {
        data: modules,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["marketplace-modules"],
        queryFn: async () => {
            const { data: mongoModules } = await apiClient.listModules();

            const onChainData = await suiClient.multiGetObjects({
                ids: mongoModules.map((m: any) => m.moduleId),
                options: { showContent: true },
            });

            const onChainDataMap = new Map(
                onChainData
                    .map((obj) => {
                        if (
                            !obj.data?.content ||
                            obj.data.content.dataType !== "moveObject"
                        )
                            return null;
                        const fields = obj.data.content.fields;
                        return [
                            obj.data.objectId,
                            {
                                isPurchasable: fields.is_purchasable,
                                price: fields.price,
                                creator: fields.creator,
                                creatorName: fields.creator_name,
                            },
                        ];
                    })
                    .filter(Boolean) as [string, any][]
            );

            return mongoModules.map((module: any) => {
                const chainData = onChainDataMap.get(module.moduleId) || {
                    isPurchasable: false,
                    price: 0,
                    creator: module.creatorId,
                    creatorName: "Unknown",
                };

                return {
                    id: module.moduleId,
                    creator: chainData.creator, // Use on-chain creator address
                    creatorName: chainData.creatorName, // Use on-chain creator name
                    name: module.name,
                    type: module.type.toLowerCase(),
                    description: module.description,
                    url: module.imageUrl,
                    thumbnailUrl: module.imageUrl,
                    content: module.content,
                    isPurchasable: chainData.isPurchasable,
                    price: Number(chainData.price),
                    walrusCertificate: module.creatorId,
                };
            });
        },
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Marketplace</h1>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                    Upload Module
                </button>
            </div>

            {isLoading ? (
                <div>Loading marketplace...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules?.map((module: MarketplaceModule) => (
                        <MarketplaceModuleCard
                            key={module.id}
                            module={module}
                            onSuccess={refetch}
                            isOwner={account?.address === module.creator}
                        />
                    ))}
                </div>
            )}

            <UploadModuleDialog
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSuccess={() => {
                    refetch();
                }}
            />
        </div>
    );
}
