import { useState } from "react";
import { ModuleCard } from "@/components/module-card";
import { mockModules } from "@/lib/mock-modules";
import { MemoryCarousel } from "@/components/ui/memory-carousel";

export default function Build() {
    const [selectedModules, setSelectedModules] = useState({
        character: null,
        knowledge: [], // Array for multiple knowledge modules
        speech: null,
        tone: null,
        memory: null,
    });
    const [memoryStickPlugged, setMemoryStickPlugged] = useState(false);

    const handleSelectModule = (type, module) => {
        setSelectedModules((prev) => {
            if (type === "knowledge") {
                // Add to knowledge array if not already present
                if (
                    !prev.knowledge.find(
                        (m) => m.onChainId === module.onChainId
                    )
                ) {
                    return {
                        ...prev,
                        knowledge: [...prev.knowledge, module],
                    };
                }
                return prev;
            }
            // For other types, just replace the current selection
            return {
                ...prev,
                [type]: module,
            };
        });
    };

    const removeKnowledge = (onChainId: string) => {
        setSelectedModules((prev) => ({
            ...prev,
            knowledge: prev.knowledge.filter((m) => m.onChainId !== onChainId),
        }));
    };

    const isComplete =
        selectedModules.character &&
        selectedModules.speech &&
        selectedModules.tone &&
        memoryStickPlugged;

    return (
        <div className="grid grid-cols-[400px,1fr] gap-6 p-6 h-full">
            {/* Left side - Assembly Area - now narrower */}
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                <h2 className="text-lg font-bold mb-4 text-gray-100">
                    Assembly Area
                </h2>
                <div className="space-y-4">
                    {/* Character Module */}
                    <div className="border-b border-gray-700 pb-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Character Module
                        </h3>
                        {selectedModules.character ? (
                            <div className="relative">
                                <ModuleCard
                                    {...selectedModules.character}
                                    isSelected
                                    isCompact
                                />
                                <button
                                    onClick={() =>
                                        setSelectedModules((prev) => ({
                                            ...prev,
                                            character: null,
                                        }))
                                    }
                                    className="absolute top-3 right-4 w-6 h-6 flex items-center justify-center bg-red-600 rounded-full text-white hover:bg-red-700"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div className="h-16 flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-lg text-sm">
                                Select a character module
                            </div>
                        )}
                    </div>

                    {/* Knowledge Modules */}
                    <div className="border-b border-gray-700 pb-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Knowledge Modules
                        </h3>
                        <div className="space-y-2">
                            {selectedModules.knowledge.map((module) => (
                                <div
                                    key={module.onChainId}
                                    className="relative"
                                >
                                    <ModuleCard
                                        {...module}
                                        isSelected
                                        isCompact
                                    />
                                    <button
                                        onClick={() =>
                                            removeKnowledge(module.onChainId)
                                        }
                                        className="absolute top-3 right-4 w-6 h-6 bg-red-600 rounded-full text-white hover:bg-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <div className="h-16 flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-lg text-sm">
                                Add knowledge modules
                            </div>
                        </div>
                    </div>

                    {/* Speech and Tone Modules */}
                    {["speech", "tone"].map((type) => (
                        <div
                            key={type}
                            className="border-b border-gray-700 pb-4"
                        >
                            <h3 className="text-sm font-medium text-gray-400 mb-2 capitalize">
                                {type} Module
                            </h3>
                            {selectedModules[type] ? (
                                <div className="relative">
                                    <ModuleCard
                                        {...selectedModules[type]}
                                        isSelected
                                        isCompact
                                    />
                                    <button
                                        onClick={() =>
                                            setSelectedModules((prev) => ({
                                                ...prev,
                                                [type]: null,
                                            }))
                                        }
                                        className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="h-16 flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-lg text-sm">
                                    Select a {type} module
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Agent Memory Selection */}
                <div className="mt-4 border-t border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">
                        Agent Memory
                    </h3>
                    <MemoryCarousel
                        memories={mockModules.memory}
                        onSelect={(memory) =>
                            handleSelectModule("memory", memory)
                        }
                        selectedMemory={selectedModules.memory}
                    />
                </div>

                {/* Instantiate Button */}
                <button
                    className={`mt-4 w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                        isComplete
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-700 cursor-not-allowed"
                    }`}
                    disabled={!isComplete}
                >
                    Instantiate Agent
                </button>
            </div>

            {/* Right side - Module Selection */}
            <div className="space-y-6 overflow-auto">
                {Object.entries(mockModules).map(([type, modules]) => (
                    <div key={type}>
                        <h3 className="text-lg font-semibold mb-4 text-gray-100 capitalize">
                            {type} Modules
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {modules.map((module) => (
                                <ModuleCard
                                    key={module.onChainId}
                                    {...module}
                                    onSelect={() =>
                                        handleSelectModule(type, module)
                                    }
                                    isSelected={
                                        type === "knowledge"
                                            ? selectedModules.knowledge.some(
                                                  (m) =>
                                                      m.onChainId ===
                                                      module.onChainId
                                              )
                                            : selectedModules[type]
                                                  ?.onChainId ===
                                              module.onChainId
                                    }
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
