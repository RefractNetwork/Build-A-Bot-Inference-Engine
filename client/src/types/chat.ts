export interface ChatMessage {
    content: string;
    role: "user" | "assistant";
}

export interface ChatLog {
    messages: ChatMessage[];
}
