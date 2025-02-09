import type { UUID, Character } from "@elizaos/core";

const BASE_URL = `http://localhost:${import.meta.env.VITE_SERVER_PORT}`;

const fetcher = async ({
    url,
    method,
    body,
    headers,
}: {
    url: string;
    method?: "GET" | "POST" | "DELETE";
    body?: object | FormData;
    headers?: HeadersInit;
}) => {
    const options: RequestInit = {
        method: method ?? "GET",
        headers: headers
            ? headers
            : {
                  Accept: "application/json",
                  "Content-Type": "application/json",
              },
    };

    if (method === "POST") {
        if (body instanceof FormData) {
            if (options.headers && typeof options.headers === "object") {
                options.headers = Object.fromEntries(
                    Object.entries(
                        options.headers as Record<string, string>
                    ).filter(([key]) => key !== "Content-Type")
                );
            }
            options.body = body;
        } else {
            options.body = JSON.stringify(body);
        }
    }

    return fetch(`${BASE_URL}${url}`, options).then(async (resp) => {
        const contentType = resp.headers.get("Content-Type");
        if (contentType === "audio/mpeg") {
            return await resp.blob();
        }

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error("Error: ", errorText);

            let errorMessage = "An error occurred.";
            try {
                const errorObj = JSON.parse(errorText);
                errorMessage = errorObj.message || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return resp.json();
    });
};

const babServerUrl = "http://localhost:5001";

export const apiClient = {
    delete: (url: string) =>
        fetcher({
            url,
            method: "DELETE",
        }),
    post: (url: string, body: object) =>
        fetcher({
            url,
            method: "POST",
            body,
        }),
    sendMessage: (
        agentId: string,
        message: string,
        selectedFile?: File | null
    ) => {
        const formData = new FormData();
        formData.append("text", message);
        formData.append("user", "user");

        if (selectedFile) {
            formData.append("file", selectedFile);
        }
        return fetcher({
            url: `/${agentId}/message`,
            method: "POST",
            body: formData,
        });
    },
    getAgents: () => fetcher({ url: "/agents" }),
    getAgent: (agentId: string): Promise<{ id: UUID; character: Character }> =>
        fetcher({ url: `/agents/${agentId}` }),
    tts: (agentId: string, text: string) =>
        fetcher({
            url: `/${agentId}/tts`,
            method: "POST",
            body: {
                text,
            },
            headers: {
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
                "Transfer-Encoding": "chunked",
            },
        }),
    whisper: async (agentId: string, audioBlob: Blob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");
        return fetcher({
            url: `/${agentId}/whisper`,
            method: "POST",
            body: formData,
        });
    },
    startAgent: (characterJson: object) =>
        fetcher({
            url: "/agent/start",
            method: "POST",
            body: {
                characterJson,
            },
        }),

    // BAB server

    // Get memory module content
    getMemoryModule: async (moduleId: string) => {
        const response = await fetch(
            `${babServerUrl}/api/getModule/${moduleId}`
        );
        if (!response.ok) {
            throw new Error("Failed to fetch memory module");
        }
        const data = await response.json();
        return data.data.content;
    },

    // Append to memory module
    appendMemoryModule: async (moduleId: string, newMessages: Record<string, any>) => {
        const response = await fetch(`${babServerUrl}/api/appendModule`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                moduleId,
                content: JSON.stringify(newMessages),
            }),
        });
        if (!response.ok) {
            throw new Error("Failed to append to memory module");
        }
        return response.json();
    },
};
