import { useState } from "react";

interface MemoryCarouselProps {
    memories: any[];
    onSelect: (memory: any) => void;
    selectedMemory: any;
}

export function MemoryCarousel({
    memories,
    onSelect,
    selectedMemory,
}: MemoryCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

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
                            className={`w-32 h-32 rounded-lg cursor-pointer transition-transform ${
                                selectedMemory?.onChainId === memory.onChainId
                                    ? "border-2 border-green-500"
                                    : "border border-gray-700"
                            }`}
                            style={{
                                backgroundColor: `hsl(${
                                    (idx * 60) % 360
                                }, 70%, 20%)`,
                            }}
                        >
                            <div className="p-3">
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
