import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const account = useCurrentAccount();

    if (!account) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
                <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-gray-700 bg-gray-900">
                    <h1 className="text-2xl font-bold text-gray-100">
                        Welcome to Build-A-Bot
                    </h1>
                    <p className="text-gray-400 mb-4">
                        Please connect your wallet to continue
                    </p>
                    <ConnectButton connectText="Connect Wallet" />
                </div>
            </div>
        );
    }

    return children;
}
