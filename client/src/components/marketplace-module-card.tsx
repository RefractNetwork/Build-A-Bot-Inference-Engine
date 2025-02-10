// @ts-nocheck
import { useState } from "react";
import {
    useCurrentAccount,
    useSuiClient,
    useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./ui/dialog";
import { MarketplaceModule } from "@/types/marketplace";

interface MarketplaceModuleCardProps {
    module: MarketplaceModule;
    onSuccess: () => void;
    isOwner: boolean;
}

export function MarketplaceModuleCard({
    module,
    onSuccess,
    isOwner,
}: MarketplaceModuleCardProps) {
    const [isListingOpen, setIsListingOpen] = useState(false);
    const [price, setPrice] = useState("");
    const client = useSuiClient();
    const account = useCurrentAccount();

    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
        execute: async ({ bytes, signature }) =>
            await client.executeTransactionBlock({
                transactionBlock: bytes,
                signature,
                options: {
                    showRawEffects: true,
                    showObjectChanges: true,
                },
            }),
    });

    const handleListForSale = () => {
        const tx = new Transaction();
        // Add a gas budget or specify it if needed
        tx.setGasBudget(2_000_000_000);

        tx.moveCall({
            target: `0x7415db99ead91a7756500adfaf3b64fd8fc1aa514d827fd5da171ca837499e6d::Core::update_module_marketplace_listing`,
            arguments: [
                tx.object(module.id),
                tx.pure.bool(true),
                tx.pure.u64(Number(price) * 1_000_000_000), // Convert to MIST (1 SUI = 1B MIST)
            ],
        });

        signAndExecuteTransaction(
            {
                transaction: tx,
                chain: "sui:devnet",
            },
            {
                onSuccess: () => {
                    setIsListingOpen(false);
                    onSuccess();
                },
                onError: (error) => {
                    console.error("Failed to list module:", error);
                },
            }
        );
    };

    const handlePurchase = async () => {
        if (!account?.address) return;

        const tx = new Transaction();

        // Get a SUI coin with sufficient balance
        const coins = await client.getCoins({
            owner: account.address,
            coinType: "0x2::sui::SUI",
        });

        const gasObjects = [];
        for (const coin of coins.data) {
            gasObjects.push({
                objectId: coin.coinObjectId,
                version: coin.version,
                digest: coin.digest,
            });
        }
        tx.setGasPayment(gasObjects); // Smash all gas tokens together and set it as gas
        tx.setSender(account.address);
        tx.setGasBudget(100_000_000);

        const modulePrice = BigInt(module.price);
        console.log("Module price:", modulePrice);
        const [paymentCoin] = tx.splitCoins(tx.gas, [modulePrice]);

        tx.moveCall({
            target: `0x7415db99ead91a7756500adfaf3b64fd8fc1aa514d827fd5da171ca837499e6d::Core::purchase_module`,
            arguments: [tx.object(module.id), paymentCoin],
        });

        tx.transferObjects([paymentCoin], account.address);

        signAndExecuteTransaction(
            {
                transaction: tx,
                chain: "sui:devnet",
            },
            {
                onSuccess: () => {
                    onSuccess();
                },
                onError: (error) => {
                    console.error("Failed to purchase module:", error);
                },
            }
        );
    };

    return (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
            <div className="aspect-video mb-4 overflow-hidden rounded-lg">
                <img
                    src={module.url}
                    alt={module.name}
                    className="w-full h-full object-cover"
                />
            </div>
            <h3 className="text-lg font-semibold text-white">{module.name}</h3>
            <div className="flex items-center gap-2 my-2">
                <span className="text-sm text-gray-400 capitalize">
                    {module.type}
                </span>
                {module.isPurchasable && (
                    <span className="px-2 py-0.5 text-xs bg-green-600/20 text-green-400 rounded-full border border-green-500/20">
                        For Sale
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                {module.description}
            </p>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">
                    {module.id.length > 10
                        ? `${module.id.slice(0, 6)}..${module.id.slice(-4)}`
                        : module.id}
                </span>
                <button
                    onClick={() => navigator.clipboard.writeText(module.id)}
                    className="p-1 text-xs text-gray-400 hover:text-gray-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                </button>
            </div>
            <div className="flex justify-between items-center mt-auto">
                <div className="text-sm text-gray-400">
                    By{" "}
                    {module.creatorName.length > 10
                        ? `${module.creatorName.slice(
                              0,
                              6
                          )}..${module.creatorName.slice(-4)}`
                        : module.creatorName}
                </div>
                <div className="flex gap-2">
                    {isOwner ? (
                        !module.isPurchasable ? (
                            <button
                                onClick={() => setIsListingOpen(true)}
                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                                List for Sale
                            </button>
                        ) : (
                            <div className="px-3 py-1.5 text-sm rounded-md bg-gray-800 text-gray-300">
                                Listed for{" "}
                                {Number(module.price) / 1_000_000_000} SUI
                            </div>
                        )
                    ) : (
                        module.isPurchasable && (
                            <button
                                onClick={handlePurchase}
                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
                            >
                                Buy for {Number(module.price) / 1_000_000_000}{" "}
                                SUI
                            </button>
                        )
                    )}
                </div>
            </div>

            <Dialog
                open={isListingOpen}
                onClose={() => setIsListingOpen(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <h2 className="text-xl font-semibold text-white">
                            List Module for Sale
                        </h2>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Price (SUI)
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.1"
                                placeholder="Enter price in SUI"
                            />
                        </div>
                        <DialogFooter>
                            <button
                                onClick={() => setIsListingOpen(false)}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleListForSale}
                                disabled={!price || Number(price) <= 0}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                List for Sale
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
