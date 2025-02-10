import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";

interface ModuleCardProps {
    type: "character" | "knowledge" | "speech" | "tone" | "memory";
    name: string;
    image: string;
    description: string;
    onChainId: string;
    data?: any;
    onSelect?: () => void;
    isSelected?: boolean;
    isCompact?: boolean;
}

export function ModuleCard({
    type,
    name,
    image,
    description,
    onChainId,
    data,
    onSelect,
    isSelected,
    isCompact,
}: ModuleCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const truncatedId = `${onChainId.slice(0, 6)}...${onChainId.slice(-4)}`;
    console.log("ModuleCard", { type, name, image, description, onChainId });

    return (
        <>
            <div
                onClick={() => setShowDetails(true)}
                className={`relative border border-gray-700 bg-gray-900 rounded-lg p-3 cursor-pointer hover:border-gray-500 transition-colors ${
                    isSelected ? "border-green-500" : ""
                } ${isCompact ? "scale-95" : ""}`}
            >
                <div className="w-40 h-40 mx-auto mb-2">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover rounded-lg"
                    />
                </div>
                <h3 className="text-sm font-semibold text-gray-100 truncate">
                    {name}
                </h3>
                <p className="text-xs text-gray-400 mb-1 line-clamp-2">
                    {description}
                </p>
                <p className="text-xs text-gray-500">ID: {truncatedId}</p>
            </div>

            <Dialog open={showDetails} onClose={() => setShowDetails(false)}>
                <DialogContent className="max-h-[80vh]">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <img
                                src={image}
                                alt={name}
                                className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div>
                                <DialogTitle>{name}</DialogTitle>
                                <p className="text-sm text-gray-400 capitalize">
                                    {type}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-gray-200">{description}</p>
                            <p className="text-sm text-gray-400 mt-2 font-mono break-all">
                                {onChainId}
                            </p>
                        </div>

                        {data && (
                            <div className="bg-gray-800 p-4 rounded-lg max-h-60 overflow-auto">
                                <h3 className="text-sm font-semibold text-gray-200 mb-2">
                                    Module Data Preview
                                </h3>
                                <pre className="text-xs text-gray-300">
                                    {JSON.stringify(data, null, 2).slice(
                                        0,
                                        500
                                    )}
                                    {JSON.stringify(data, null, 2).length > 500
                                        ? "\n... (truncated)"
                                        : ""}
                                </pre>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setShowDetails(false)}
                            className="px-4 py-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onSelect?.();
                                setShowDetails(false);
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            {type === "knowledge"
                                ? "Add Knowledge"
                                : "Select Module"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
