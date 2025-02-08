import { useEffect, useState } from "react";

interface MemoryCarouselProps {
    memories: any[];
    onSelect: (memory: any) => void;
    selectedMemory: any;
    defaultSelected?: any;
}

export function MemoryCarousel({
    memories,
    onSelect,
    selectedMemory,
    defaultSelected,
}: MemoryCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (defaultSelected && !selectedMemory) {
            onSelect(defaultSelected);
        }
    }, [defaultSelected, selectedMemory, onSelect]);

    const nextMemory = () => {
        setCurrentIndex((prev) => (prev + 1) % memories.length);
    };

    const prevMemory = () => {
        setCurrentIndex(
            (prev) => (prev - 1 + memories.length) % memories.length
        );
    };

    return (
        <div className="relative flex items-center justify-center gap-4">
            <button
                onClick={prevMemory}
                className="p-2 bg-gray-800 rounded-full"
            >
                ←
            </button>

            <div className="flex gap-4">
                {memories.map((memory, idx) => (
                    <div
                        key={memory.onChainId}
                        className={`transform transition-all duration-300 ${
                            idx === currentIndex
                                ? "scale-100 opacity-100"
                                : "scale-90 opacity-50 hidden"
                        }`}
                    >
                        <div
                            onClick={() => onSelect(memory)}
                            className={`w-32 h-32 rounded-lg cursor-pointer transition-transform flex flex-col ${
                                selectedMemory?.onChainId === memory.onChainId
                                    ? "border-2 border-green-500"
                                    : "border border-gray-700"
                            }`}
                            style={{
                                background:
                                    "linear-gradient(to bottom, #2c3e50, #34495e)",
                            }}
                        >
                            {/* Floppy Disk Design */}
                            <div className="flex-1 p-3 relative">
                                <div className="absolute top-2 right-2 w-4 h-4 bg-gray-700"></div>
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-gray-700"></div>
                                <h4 className="text-sm font-medium text-white">
                                    {memory.name}
                                </h4>
                                <p className="text-xs text-gray-300 mt-1">
                                    {memory.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={nextMemory}
                className="p-2 bg-gray-800 rounded-full"
            >
                →
            </button>
        </div>
    );
}
