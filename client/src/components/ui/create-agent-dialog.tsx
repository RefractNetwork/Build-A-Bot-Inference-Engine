import { useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface ToastProps {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
    return (
        <div
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg p-4 text-white ${
                type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
        >
            <span>{message}</span>
            <button onClick={onClose} className="p-1 hover:opacity-80">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

type TabType = "character" | "knowledge" | "memory";

export function CreateAgentDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("character");
    const [characterJson, setCharacterJson] = useState("");
    const [knowledgeJson, setKnowledgeJson] = useState("");
    const [memoryJson, setMemoryJson] = useState("");
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);
    const queryClient = useQueryClient();

    const createAgentMutation = useMutation({
        mutationFn: (characterJson: any) =>
            apiClient.post("/agent/start", { characterJson }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            setIsOpen(false);
            resetForm();
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

    const resetForm = () => {
        setCharacterJson("");
        setKnowledgeJson("");
        setMemoryJson("");
        setActiveTab("character");
    };

    const handleFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>,
        type: TabType
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                switch (type) {
                    case "character":
                        setCharacterJson(content);
                        break;
                    case "knowledge":
                        setKnowledgeJson(content);
                        break;
                    case "memory":
                        setMemoryJson(content);
                        break;
                }
            };
            reader.readAsText(file);
        }
    };

    const handleCreate = () => {
        try {
            let finalCharacter = {};
            if (characterJson) {
                finalCharacter = JSON.parse(characterJson);
            }

            if (knowledgeJson) {
                const additionalKnowledge = JSON.parse(knowledgeJson);
                finalCharacter = {
                    ...finalCharacter,
                    knowledge: [
                        ...(finalCharacter.knowledge || []),
                        ...additionalKnowledge,
                    ],
                };
            }

            if (memoryJson) {
                const memories = JSON.parse(memoryJson);
                finalCharacter = {
                    ...finalCharacter,
                    knowledge: [
                        ...(finalCharacter.knowledge || []),
                        ...memories,
                    ],
                };
            }

            createAgentMutation.mutate(finalCharacter);
        } catch (error) {
            setToast({ message: "Invalid JSON format", type: "error" });
        }
    };

    const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-gray-200"
            }`}
        >
            {label}
        </button>
    );

    const TabContent = ({
        tab,
        value,
        onChange,
    }: {
        tab: TabType;
        value: string;
        onChange: (value: string) => void;
    }) => (
        <div className={`space-y-4 ${activeTab === tab ? "block" : "hidden"}`}>
            <input
                type="file"
                accept=".json"
                id={`json-upload-${tab}`}
                className="hidden"
                onChange={(e) => handleFileUpload(e, tab)}
            />
            <button
                className="w-full px-4 py-2 border border-gray-700 rounded-lg flex items-center justify-center gap-2 text-gray-200 hover:bg-gray-800 transition-colors"
                onClick={() =>
                    document.getElementById(`json-upload-${tab}`)?.click()
                }
            >
                <Upload className="h-4 w-4" />
                Upload {tab.charAt(0).toUpperCase() + tab.slice(1)} JSON
            </button>

            <textarea
                placeholder={`Paste your ${tab} JSON configuration here...`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-[200px] p-2 bg-gray-800 border border-gray-700 rounded-lg resize-none text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );

    return (
        <>
            {/* Add Agent Card - remains the same */}
            <div
                onClick={() => setIsOpen(true)}
                className="border border-gray-700 bg-gray-900 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
            >
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-100">
                        Add New Agent
                    </h3>
                </div>
                <div className="p-4">
                    <div className="rounded bg-gray-800 aspect-square w-full grid place-items-center">
                        <Plus className="w-12 h-12 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Modal Dialog */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-100">
                                Create New Agent
                            </h2>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-200"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex justify-between mb-4 border-b border-gray-700">
                            <TabButton tab="character" label="Character" />
                            <TabButton tab="knowledge" label="Knowledge" />
                            <TabButton tab="memory" label="Memory" />
                        </div>

                        <div className="space-y-4">
                            <TabContent
                                tab="character"
                                value={characterJson}
                                onChange={setCharacterJson}
                            />
                            <TabContent
                                tab="knowledge"
                                value={knowledgeJson}
                                onChange={setKnowledgeJson}
                            />
                            <TabContent
                                tab="memory"
                                value={memoryJson}
                                onChange={setMemoryJson}
                            />

                            <button
                                onClick={handleCreate}
                                disabled={
                                    !characterJson ||
                                    createAgentMutation.isPending
                                }
                                className={`w-full py-2 px-4 rounded-lg text-white ${
                                    !characterJson ||
                                    createAgentMutation.isPending
                                        ? "bg-gray-700 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                } transition-colors`}
                            >
                                {createAgentMutation.isPending
                                    ? "Creating..."
                                    : "Create Agent"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification - remains the same */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}
