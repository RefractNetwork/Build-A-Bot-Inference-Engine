// @ts-nocheck
import { useEffect, useState } from "react";
import { ModuleCard } from "@/components/module-card";
// import { MemoryCarousel } from "@/components/ui/memory-carousel";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";
import { useOwnedModules } from "@/hooks/useOwnedModuleInstances";
import { Transaction } from "@mysten/sui/transactions";
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient,
} from "@mysten/dapp-kit";

type ModuleType = "character" | "knowledge" | "speech" | "tone" | "memory";

const BAB_PACKAGE_ID = import.meta.env.VITE_BAB_PACKAGE_ID;
const BAB_NETWORK = import.meta.env.VITE_BAB_NETWORK;

interface SelectedModules {
    character: any;
    knowledge: any[];
    speech: any | null;
    tone: any | null;
    memory: any | null;
}

const COOKIE_KEY = "build_config";

export default function Build() {
    const navigate = useNavigate();
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

    const {
        data: ownedModules,
        isLoading,
        refetch: refetchModules,
    } = useOwnedModules();

    const [isCreatingMemory, setIsCreatingMemory] = useState(false);

    // Initialize state from cookie if available
    const [selectedModules, setSelectedModules] = useState<SelectedModules>(
        () => {
            const savedConfig = Cookies.get(COOKIE_KEY);
            if (!savedConfig) {
                return {
                    character: null,
                    knowledge: [],
                    speech: null,
                    tone: null,
                    memory: null,
                };
            }

            const config = JSON.parse(savedConfig);

            // Clean up configuration if modules are no longer owned
            const cleanConfig = {
                character:
                    config.character &&
                    ownedModules?.character?.some(
                        (m) => m.onChainId === config.character.onChainId
                    )
                        ? config.character
                        : null,
                knowledge:
                    config.knowledge?.filter((k) =>
                        ownedModules?.knowledge?.some(
                            (m) => m.onChainId === k.onChainId
                        )
                    ) || [],
                speech:
                    config.speech &&
                    ownedModules?.speech?.some(
                        (m) => m.onChainId === config.speech.onChainId
                    )
                        ? config.speech
                        : null,
                tone:
                    config.tone &&
                    ownedModules?.tone?.some(
                        (m) => m.onChainId === config.tone.onChainId
                    )
                        ? config.tone
                        : null,
                memory:
                    config.memory &&
                    ownedModules?.memory?.some(
                        (m) => m.onChainId === config.memory.onChainId
                    )
                        ? config.memory
                        : null,
            };

            // Only update cookie if we cleaned something
            if (JSON.stringify(cleanConfig) !== savedConfig) {
                Cookies.set(COOKIE_KEY, JSON.stringify(cleanConfig), {
                    expires: 7,
                });
            }

            return cleanConfig;
        }
    );

    // Add a validation effect when ownedModules changes
    useEffect(() => {
        if (!ownedModules) return;

        setSelectedModules((prev) => {
            const newConfig = {
                character:
                    prev.character &&
                    ownedModules.character?.some(
                        (m) => m.onChainId === prev.character.onChainId
                    )
                        ? prev.character
                        : null,
                knowledge: prev.knowledge.filter((k) =>
                    ownedModules.knowledge?.some(
                        (m) => m.onChainId === k.onChainId
                    )
                ),
                speech:
                    prev.speech &&
                    ownedModules.speech?.some(
                        (m) => m.onChainId === prev.speech.onChainId
                    )
                        ? prev.speech
                        : null,
                tone:
                    prev.tone &&
                    ownedModules.tone?.some(
                        (m) => m.onChainId === prev.tone.onChainId
                    )
                        ? prev.tone
                        : null,
                memory:
                    prev.memory &&
                    ownedModules.memory?.some(
                        (m) => m.onChainId === prev.memory.onChainId
                    )
                        ? prev.memory
                        : null,
            };

            // Only update if something changed
            if (JSON.stringify(newConfig) !== JSON.stringify(prev)) {
                Cookies.set(COOKIE_KEY, JSON.stringify(newConfig), {
                    expires: 7,
                });
                return newConfig;
            }

            return prev;
        });
    }, [ownedModules]);

    // Helper function to check if a module is still owned
    const isModuleOwned = async (type: ModuleType, moduleId: string) => {
        await refetchModules();

        if (!ownedModules || !ownedModules[type]) return false;
        return ownedModules[type].some((m) => m.onChainId === moduleId);
    };

    // Update handleSelectModule to include ownership check
    const handleSelectModule = async (type: ModuleType, module: any) => {
        if (!isModuleOwned(type, module.onChainId)) {
            console.warn(`Module ${module.onChainId} is no longer owned`);
            return;
        }

        try {
            const moduleContent = await apiClient.getMemoryModule(
                module.onChainId
            );

            const moduleWithContent = {
                ...module,
                data: moduleContent,
            };

            setSelectedModules((prev) => {
                const newConfig = {
                    ...prev,
                    [type]:
                        type === "knowledge"
                            ? [...prev.knowledge, moduleWithContent]
                            : moduleWithContent,
                };
                Cookies.set(COOKIE_KEY, JSON.stringify(newConfig), {
                    expires: 7,
                });
                return newConfig;
            });
        } catch (error) {
            console.error("Error selecting module:", error);
        }
    };

    // Update cookie whenever selections change
    useEffect(() => {
        Cookies.set(COOKIE_KEY, JSON.stringify(selectedModules), {
            expires: 7,
        });
    }, [selectedModules]);

    const createAgentMutation = useMutation({
        mutationFn: (characterJson: any) =>
            apiClient.post("/agent/start", { characterJson }),
    });

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
    const canInstantiate = selectedModules.character && selectedModules.memory;
    // selectedModules.memory &&
    // // Speech and tone must either both be selected or both be null
    // ((selectedModules.speech === null && selectedModules.tone === null) ||
    //     (selectedModules.speech && selectedModules.tone));

    const handleInstantiate = async () => {
        if (!selectedModules.character || !selectedModules.memory) return;

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

            // Add speech and tone if selected
            if (selectedModules.speech) {
                // Set up voice settings structure
                finalCharacter.settings = {
                    voice: {
                        model:
                            selectedModules.speech.data.elevenlabs?.voiceId ||
                            "eleven_multilingual_v2",
                        elevenlabs: {
                            voiceId:
                                selectedModules.speech.data.elevenlabs
                                    ?.voiceId || "21m00Tcm4TlvDq8ikWAM",
                            model:
                                selectedModules.speech.data.elevenlabs?.model ||
                                "eleven_multilingual_v2",
                            stability:
                                selectedModules.speech.data.elevenlabs
                                    ?.stability || "0.5",
                            similarityBoost:
                                selectedModules.speech.data.elevenlabs
                                    ?.similarityBoost || "0.9",
                            style:
                                selectedModules.speech.data.elevenlabs?.style ||
                                "0.66",
                            useSpeakerBoost:
                                selectedModules.speech.data.elevenlabs
                                    ?.useSpeakerBoost || "false",
                        },
                    },
                };

                // finalCharacter.tone = selectedModules.tone.data || {};
            }

            finalCharacter.name =
                finalCharacter.name + "#" + Math.floor(Math.random() * 10000);

            // Create the agent
            const response = await apiClient.startAgent(finalCharacter);

            if (response) {
                // Set agent_started to false to indicate a new instantiation
                Cookies.set("agent_started", "false", { expires: 7 });

                navigate(
                    `/chat/${response.id}?moduleId=${selectedModules.memory.onChainId}`
                );
            }
        } catch (error) {
            console.error("Failed to create agent", error);
        }
    };

    useEffect(() => {
        refetchModules();
    }, [refetchModules]);

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
                            type={type}
                            name={module.name}
                            image={module.imageUrl} // Map imageUrl to image
                            description={module.description}
                            onChainId={module.onChainId}
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    const handleCreateMemory = () => {
        setIsCreatingMemory(true);
        const tx = new Transaction();
        tx.moveCall({
            target: `${BAB_PACKAGE_ID}::Core::publish_module`,
            arguments: [
                tx.pure.string("Agent Memory"),
                tx.pure.string("memory"),
                tx.pure.string(
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFMvrcZMX0fe5AzzDU4wTXCaMYKNUfJe86kA&s"
                ),
                tx.pure.string(
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFMvrcZMX0fe5AzzDU4wTXCaMYKNUfJe86kA&s"
                ),
                tx.pure.string("Memory storage for agent interactions"),
                tx.pure.string(account.address),
            ],
        });

        signAndExecuteTransaction(
            {
                transaction: tx,
                chain: `sui:${BAB_NETWORK}`,
            },
            {
                onSuccess: async (result) => {
                    try {
                        const createdModule = result.objectChanges?.find(
                            (change) =>
                                change.type === "created" &&
                                change.objectType.endsWith(
                                    "::Core::ComposableModule"
                                )
                        );

                        if (!createdModule) {
                            throw new Error(
                                "Failed to get created module data"
                            );
                        }

                        await apiClient.createModule({
                            moduleId: createdModule.objectId,
                            name: "Agent Memory",
                            type: "memory",
                            imageUrl:
                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFMvrcZMX0fe5AzzDU4wTXCaMYKNUfJe86kA&s",
                            content: JSON.stringify({}),
                            creatorId: "System",
                            description:
                                "Memory storage for agent interactions",
                        });

                        // Refetch and select new module
                        await refetchModules();

                        const newModule = {
                            onChainId: createdModule.objectId,
                            name: "Agent Memory",
                            type: "memory",
                            imageUrl:
                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFMvrcZMX0fe5AzzDU4wTXCaMYKNUfJe86kA&s",
                            description:
                                "Memory storage for agent interactions",
                        };

                        console.log("New memory module:", newModule);
                        setTimeout(async () => {
                            await handleSelectModule("memory", newModule);
                        }, 1000);
                        setIsCreatingMemory(false);
                    } catch (error) {
                        console.error(
                            "Failed to initialize module content:",
                            error
                        );
                        setIsCreatingMemory(false);
                    }
                },
                onError: (error) => {
                    console.error("Failed to create memory module:", error);
                    setIsCreatingMemory(false);
                },
            }
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
                            Character Module
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
                                <div key={module.instanceId}>
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

                    {/* Memory Module */}
                    <div className="border-b border-gray-700 pb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-medium text-gray-400">
                                Memory Capsule
                            </h3>
                            <button
                                onClick={handleCreateMemory}
                                disabled={isCreatingMemory}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isCreatingMemory
                                    ? "Creating..."
                                    : "Create New"}
                            </button>
                        </div>
                        {renderModule("memory", selectedModules.memory, true)}
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
                {isLoading ? (
                    <div className="text-center">Loading modules...</div>
                ) : (
                    <>
                        {/* Character, Knowledge, Speech, Tone sections remain the same */}
                        {/* Character Modules */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-100">
                                Character Modules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(ownedModules?.character || []).length > 0 ? (
                                    ownedModules.character.map((module) => (
                                        <div key={module.instanceId}>
                                            {renderModule(
                                                "character",
                                                module,
                                                false
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-gray-500 text-center py-4">
                                        No character modules found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Knowledge Modules */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-100">
                                Knowledge Modules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(ownedModules?.knowledge || []).length > 0 ? (
                                    ownedModules.knowledge.map((module) => (
                                        <div key={module.instanceId}>
                                            {renderModule(
                                                "knowledge",
                                                module,
                                                false
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-gray-500 text-center py-4">
                                        No knowledge modules found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Speech Modules */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-100">
                                Speech Modules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(ownedModules?.speech || []).length > 0 ? (
                                    ownedModules.speech.map((module) => (
                                        <div key={module.instanceId}>
                                            {renderModule(
                                                "speech",
                                                module,
                                                false
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-gray-500 text-center py-4">
                                        No speech modules found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tone Modules */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-100">
                                Tone Modules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(ownedModules?.tone || []).length > 0 ? (
                                    ownedModules.tone.map((module) => (
                                        <div key={module.instanceId}>
                                            {renderModule(
                                                "tone",
                                                module,
                                                false
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-gray-500 text-center py-4">
                                        No tone modules found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Memory Modules */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-100">
                                    Memory Modules
                                </h3>
                                <button
                                    onClick={handleCreateMemory}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create New Memory
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(ownedModules?.memory || []).length > 0 ? (
                                    ownedModules.memory.map((module) => (
                                        <ModuleCard
                                            key={module.onChainId}
                                            type="memory"
                                            name={module.name}
                                            image={module.imageUrl}
                                            description={module.description}
                                            onChainId={module.onChainId}
                                            onSelect={() =>
                                                handleSelectModule(
                                                    "memory",
                                                    module
                                                )
                                            }
                                            isSelected={
                                                selectedModules.memory
                                                    ?.onChainId ===
                                                module.onChainId
                                            }
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-gray-500 text-center py-4">
                                        No memory modules found
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
