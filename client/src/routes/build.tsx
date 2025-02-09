// @ts-nocheck
import { useState } from "react";
import { ModuleCard } from "@/components/module-card";
import { mockModules } from "@/lib/mock-modules";
import { MemoryCarousel } from "@/components/ui/memory-carousel";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Toast } from "@/components/ui/toast";
import { useNavigate } from "react-router";

type ModuleType = "character" | "knowledge" | "speech" | "tone" | "memory";

interface SelectedModules {
    character: any;
    knowledge: any[];
    speech: any | null;
    tone: any | null;
    memory: any | null;
}

export default function Build() {
    const navigate = useNavigate();
    const [selectedModules, setSelectedModules] = useState<SelectedModules>({
        character: null,
        knowledge: [],
        speech: null,
        tone: null,
        memory: mockModules.memory[0],
    });
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

    const createAgentMutation = useMutation({
        mutationFn: (characterJson: any) =>
            apiClient.post("/agent/start", { characterJson }),
        onSuccess: () => {
            setToast({
                message: "Agent created successfully",
                type: "success",
            });
        },
        onError: (error) => {
            setToast({
                message: `Failed to create agent: ${error.message}`,
                type: "error",
            });
        },
    });

    const handleSelectModule = (type: ModuleType, module: any) => {
        setSelectedModules((prev) => ({
            ...prev,
            [type]: type === "knowledge" ? [...prev.knowledge, module] : module,
        }));
    };

    const removeModule = (type: ModuleType, onChainId?: string) => {
        setSelectedModules((prev) => ({
            ...prev,
            [type]:
                type === "knowledge"
                    ? prev.knowledge.filter((m) => m.onChainId !== onChainId)
                    : null,
        }));
    };

    // Simplified instantiation check
    const canInstantiate =
        selectedModules.character &&
        selectedModules.memory &&
        // Speech and tone must either both be selected or both be null
        ((selectedModules.speech === null && selectedModules.tone === null) ||
            (selectedModules.speech && selectedModules.tone));

    const handleInstantiate = async () => {
        if (!selectedModules.character) return;

        try {
            // Start with the base character
            let finalCharacter = { ...selectedModules.character.data };

            // Add knowledge modules
            if (selectedModules.knowledge.length > 0) {
                const additionalKnowledge = selectedModules.knowledge.flatMap(
                    (module) => module.data
                );
                finalCharacter.knowledge = [
                    ...(finalCharacter.knowledge || []),
                    ...additionalKnowledge,
                ];
            }

            // Add memory module
            if (selectedModules.memory) {
                // Memory data is an array of strings in format "user: ... response: ..."
                const memoryKnowledge = selectedModules.memory.data.map(
                    (memoryItem) => memoryItem // The memory items are already formatted
                );

                // Add memories to knowledge array
                finalCharacter.knowledge = [
                    ...(finalCharacter.knowledge || []),
                    ...memoryKnowledge,
                ];

                console.log("Final Knowledge Array:", finalCharacter.knowledge); // Debug log
            }

            // Add speech and tone if selected
            if (selectedModules.speech && selectedModules.tone) {
                finalCharacter.speech = selectedModules.speech.data || {};
                finalCharacter.tone = selectedModules.tone.data || {};
            }

            // Example initial chat history
            const initialMemories = [
                {
                    text: "Hello! How are you?",
                    user: "user",
                    createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
                },
                {
                    text: "I'm doing great! How can I help you today?",
                    user: "assistant",
                    createdAt: Date.now() - 1000 * 60 * 4, // 4 minutes ago
                },
            ];

            // Create the agent with initial memories
            const response = await apiClient.startAgent(
                finalCharacter
                // initialMemories
            );

            if (response.id) {
                navigate(`/chat/${response.id}`);
            }
        } catch (error) {
            setToast({
                message: "Error creating agent: " + error.message,
                type: "error",
            });
        }
    };

    const renderModule = (
        type: ModuleType,
        module: any = null,
        showDelete = false
    ) => {
        const isSelected = module
            ? type === "knowledge"
                ? selectedModules.knowledge.some(
                      (m) => m.onChainId === module.onChainId
                  )
                : selectedModules[type]?.onChainId === module.onChainId
            : false;

        return (
            <div className="relative">
                {module ? (
                    <>
                        <ModuleCard
                            {...module}
                            isSelected={isSelected}
                            isCompact={true}
                            onSelect={() => handleSelectModule(type, module)}
                        />
                        {isSelected && showDelete && (
                            <button
                                onClick={() =>
                                    removeModule(type, module.onChainId)
                                }
                                className="absolute top-3 right-4 w-6 h-6 flex items-center justify-center bg-red-600 rounded-full text-white hover:bg-red-700"
                            >
                                ×
                            </button>
                        )}
                    </>
                ) : (
                    <div className="h-16 flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-lg text-sm">
                        Select a {type} module
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 p-6 h-full">
            {/* Assembly Area */}
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                <h2 className="text-lg font-bold mb-4 text-gray-100">
                    Assembly Area
                </h2>

                <div className="space-y-4">
                    {/* Required Modules */}
                    <div className="border-b border-gray-700 pb-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Character Module {import.meta.env.BAB_PACKAGE_ID}
                        </h3>
                        {renderModule(
                            "character",
                            selectedModules.character,
                            true
                        )}
                    </div>

                    {/* Knowledge Modules */}
                    <div className="border-b border-gray-700 pb-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Knowledge Modules
                        </h3>
                        <div className="space-y-2">
                            {selectedModules.knowledge.map((module) => (
                                <div key={module.onChainId}>
                                    {renderModule("knowledge", module, true)}
                                </div>
                            ))}
                            {renderModule("knowledge")}
                        </div>
                    </div>

                    {/* Speech and Tone */}
                    <div className="border-b border-gray-700 pb-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Voice & Tone (Optional)
                        </h3>
                        <div className="space-y-2">
                            {renderModule(
                                "speech",
                                selectedModules.speech,
                                true
                            )}
                            {renderModule("tone", selectedModules.tone, true)}
                        </div>
                    </div>

                    {/* Memory Selection */}
                    <div className="mt-4 border-t border-gray-700 pt-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Agent Memory <span className="text-red-500">*</span>
                        </h3>
                        <MemoryCarousel
                            memories={mockModules.memory}
                            onSelect={(memory) =>
                                handleSelectModule("memory", memory)
                            }
                            selectedMemory={selectedModules.memory}
                            defaultSelected={mockModules.memory[0]}
                        />
                    </div>

                    {/* Instantiate Button */}
                    <button
                        onClick={handleInstantiate}
                        disabled={
                            !canInstantiate || createAgentMutation.isPending
                        }
                        className={`mt-4 w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            canInstantiate && !createAgentMutation.isPending
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-gray-700 cursor-not-allowed"
                        }`}
                    >
                        {createAgentMutation.isPending
                            ? "Creating Agent..."
                            : "Instantiate Agent"}
                    </button>
                </div>
            </div>

            {/* Module Selection */}
            <div className="space-y-6 overflow-auto">
                {Object.entries(mockModules)
                    .filter(([type]) => type !== "memory")
                    .map(([type, modules]) => (
                        <div key={type}>
                            <h3 className="text-lg font-semibold mb-4 text-gray-100 capitalize">
                                {type} Modules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {modules.map((module) => (
                                    <div key={module.onChainId}>
                                        {renderModule(
                                            type as ModuleType,
                                            module,
                                            false
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
