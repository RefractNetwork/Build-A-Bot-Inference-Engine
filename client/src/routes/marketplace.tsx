// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { UploadModuleDialog } from "@/components/upload-module-dialog";
import { MarketplaceModule } from "@/types/marketplace";
import { MarketplaceModuleCard } from "@/components/marketplace-module-card";
import { apiClient } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Marketplace() {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("buy");
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

    const organizeModulesByType = (moduleList: MarketplaceModule[]) => {
        return moduleList.reduce(
            (acc: { [key: string]: MarketplaceModule[] }, module) => {
                if (module.type.toLowerCase() === "memory") return acc;
                const type = module.type.toLowerCase();
                if (!acc[type]) acc[type] = [];
                acc[type].push(module);
                return acc;
            },
            {}
        );
    };

    const myUploads =
        modules?.filter((m) => m.creator === account?.address) || [];
    const purchasableModules =
        modules?.filter((m) => m.creator !== account?.address) || [];

    const categorizedMyUploads = organizeModulesByType(myUploads);
    const categorizedPurchasable = organizeModulesByType(purchasableModules);

    return (
        <div className="container mx-auto p-6">
            {/* Fixed Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Marketplace</h1>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Upload Module
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                        <p className="text-gray-400">
                            Loading marketplace modules...
                        </p>
                    </div>
                </div>
            ) : (
                <Tabs defaultValue="buy" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="buy">Buy Modules</TabsTrigger>
                        <TabsTrigger value="uploads">My Uploads</TabsTrigger>
                    </TabsList>

                    <TabsContent value="buy" className="outline-none mt-0">
                        <div className="space-y-8 w-full">
                            {Object.entries(categorizedPurchasable).length >
                            0 ? (
                                Object.entries(categorizedPurchasable).map(
                                    ([type, moduleList]) => (
                                        <div key={type} className="w-full">
                                            <h2 className="text-xl font-semibold mb-4 capitalize">
                                                {type} Modules
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {moduleList.map(
                                                    (
                                                        module: MarketplaceModule
                                                    ) => (
                                                        <MarketplaceModuleCard
                                                            key={module.id}
                                                            module={module}
                                                            onSuccess={refetch}
                                                            isOwner={false}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )
                                )
                            ) : (
                                <div className="flex items-center justify-center min-h-[40vh] w-full">
                                    <div className="text-center py-12 rounded-lg w-full max-w-md">
                                        <p>No modules available for purchase</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="uploads" className="outline-none mt-0">
                        <div className="space-y-8 w-full">
                            {Object.entries(categorizedMyUploads).length > 0 ? (
                                Object.entries(categorizedMyUploads).map(
                                    ([type, moduleList]) => (
                                        <div key={type} className="w-full">
                                            <h2 className="text-xl font-semibold mb-4 capitalize">
                                                {type} Modules
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {moduleList.map(
                                                    (
                                                        module: MarketplaceModule
                                                    ) => (
                                                        <MarketplaceModuleCard
                                                            key={module.id}
                                                            module={module}
                                                            onSuccess={refetch}
                                                            isOwner={true}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )
                                )
                            ) : (
                                <div className="flex items-center justify-center min-h-[40vh] w-full">
                                    <div className="text-center py-12 bg-gray-900/50 rounded-lg w-full max-w-md">
                                        <p className="text-gray-400">
                                            You haven't uploaded any modules yet
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
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
