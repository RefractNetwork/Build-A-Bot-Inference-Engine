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

const BAB_PACKAGE_ID = import.meta.env.VITE_BAB_PACKAGE_ID;
const BAB_NETWORK = import.meta.env.VITE_BAB_NETWORK;

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
            target: `${BAB_PACKAGE_ID}::Core::update_module_marketplace_listing`,
            arguments: [
                tx.object(module.id),
                tx.pure.bool(true),
                tx.pure.u64(Number(price) * 1_000_000_000), // Convert to MIST (1 SUI = 1B MIST)
            ],
        });

        signAndExecuteTransaction(
            {
                transaction: tx,
                chain: `sui:${BAB_NETWORK}`,
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
        const [paymentCoin] = tx.splitCoins(tx.gas, [modulePrice]);

        tx.moveCall({
            target: `${BAB_PACKAGE_ID}::Core::purchase_module`,
            arguments: [tx.object(module.id), paymentCoin],
        });

        tx.transferObjects([paymentCoin], account.address);

        signAndExecuteTransaction(
            {
                transaction: tx,
                chain: `sui:${BAB_NETWORK}`,
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

    const formatAddress = (address: string) => {
        return address.length > 12
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : address;
    };

    return (
        <div className="group relative border border-gray-800 rounded-xl p-4 bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="aspect-video mb-4 overflow-hidden rounded-lg bg-gray-800">
                <img
                    src={module.url}
                    alt={module.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
            </div>
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-white truncate">
                        {module.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 capitalize">
                            {module.type}
                        </span>
                        {module.isPurchasable && (
                            <span className="px-2 py-0.5 text-xs bg-green-600/20 text-green-400 rounded-full border border-green-500/20">
                                Listed
                            </span>
                        )}
                    </div>
                </div>

                <p className="text-sm text-gray-300 line-clamp-2">
                    {module.description}
                </p>

                {/* Module info section */}
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm min-w-0">
                            <span className="text-gray-500 shrink-0">
                                Object:
                            </span>
                            <a
                                href={`https://suiscan.xyz/${BAB_NETWORK}/object/${module.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors truncate"
                            >
                                {formatAddress(module.id)}
                            </a>
                        </div>
                        {isOwner ? (
                            !module.isPurchasable ? (
                                <button
                                    onClick={() => setIsListingOpen(true)}
                                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0"
                                >
                                    List for Sale
                                </button>
                            ) : (
                                <div className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 shrink-0">
                                    {Number(module.price) / 1_000_000_000} SUI
                                </div>
                            )
                        ) : (
                            module.isPurchasable && (
                                <button
                                    onClick={handlePurchase}
                                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-2 shrink-0"
                                >
                                    <span>
                                        {Number(module.price) / 1_000_000_000}{" "}
                                        SUI
                                    </span>
                                    <span>Buy Now</span>
                                </button>
                            )
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Creator:</span>
                        <a
                            href={`https://suiscan.xyz/${BAB_NETWORK}/address/${module.creator}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors truncate"
                        >
                            {formatAddress(module.creator)}
                        </a>
                    </div>
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
