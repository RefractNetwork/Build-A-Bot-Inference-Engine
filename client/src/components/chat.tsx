import { Button } from "@/components/ui/button";
import {
    ChatBubble,
    ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { useTransition, animated, type AnimatedProps } from "@react-spring/web";
import { Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import type { Content, UUID } from "@elizaos/core";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "./ui/avatar";
import CopyButton from "./copy-button";
import ChatTtsButton from "./ui/chat/chat-tts-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import AIWriter from "react-aiwriter";
import type { IAttachment } from "@/types";
import { AudioRecorder } from "./audio-recorder";
import { Badge } from "./ui/badge";
import { useAutoScroll } from "./ui/chat/hooks/useAutoScroll";

type ExtraContentFields = {
    user: string;
    createdAt: number;
    isLoading?: boolean;
};

type ContentWithUser = Content & ExtraContentFields;

type AnimatedDivProps = AnimatedProps<{ style: React.CSSProperties }> & {
    children?: React.ReactNode;
};

function cleanMessage(text: string): string {
    return text
        .replace(/<chatlog>.*?<\/chatlog>/gs, "")
        .replace(/<chatlog>.*?<chatlog\/>/gs, "")
        .trim();
}

export default function Page({ agentId }: { agentId: UUID }) {
    // { memoryId }: { memoryId: any }
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const queryClient = useQueryClient();

    const getMessageVariant = (role: string) =>
        role !== "user" ? "received" : "sent";

    const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } =
        useAutoScroll({
            smooth: true,
        });

    useEffect(() => {
        const loadMemoryModule = async () => {
            try {
                const moduleId = "0x8d4e3c2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3";
                const content = await apiClient.getMemoryModule(moduleId);

                // Convert the content object to an array and sort by createdAt
                const initialMessages: ContentWithUser[] = Object.entries(content)
                    .map(([_, item]: [string, any]) => ({
                        text: item.text || "",
                        user: item.user === "system" ? "assistant" : item.user, // Normalize system to assistant
                        createdAt: item.createdAt || Date.now(),
                        attachments: item.attachments || undefined,
                    }))
                    .filter(msg => msg.text && msg.user) // Filter out invalid messages
                    .sort((a, b) => a.createdAt - b.createdAt);

                if (initialMessages.length > 0) {
                    queryClient.setQueryData(
                        ["messages", agentId],
                        (old: ContentWithUser[] = []) => 
                            old.length === 0 ? initialMessages : old
                    );
                }
            } catch (error) {
                console.error("Failed to load memory module:", error);
            }
        };

        loadMemoryModule();
    }, [agentId, queryClient]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (e.nativeEvent.isComposing) return;
            handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
        }
    };

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input) return;

        const attachments: IAttachment[] | undefined = selectedFile
            ? [
                  {
                      url: URL.createObjectURL(selectedFile),
                      contentType: selectedFile.type,
                      title: selectedFile.name,
                  },
              ]
            : undefined;

        // Create user message with timestamp
        const userMessage = {
            text: input,
            user: "user",
            createdAt: Date.now(),
            attachments,
        };

        // Store user message immediately
        const moduleId = "0x8d4e3c2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3";
        const userMessageToStore = {
            [`message_${Date.now()}_user`]: {
                text: input,
                user: "user",
                createdAt: Date.now(),
                attachments,
            }
        };
        
        // Store user message in memory module
        apiClient.appendMemoryModule(moduleId, userMessageToStore)
            .catch(error => console.error('Failed to store user message:', error));

        // Update UI with user message
        queryClient.setQueryData(
            ["messages", agentId],
            (old: ContentWithUser[] = []) => [...old, userMessage]
        );

        // Send message to agent
        sendMessageMutation.mutate({
            message: input,
            selectedFile: selectedFile ? selectedFile : null,
        });

        setSelectedFile(null);
        setInput("");
        formRef.current?.reset();
    };

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const sendMessageMutation = useMutation({
        mutationKey: ["send_message", agentId],
        mutationFn: async ({
            message,
            selectedFile,
        }: {
            message: string;
            selectedFile?: File | null;
        }) => {
            const previousMessages =
                queryClient.getQueryData<ContentWithUser[]>([
                    "messages",
                    agentId,
                ]) || [];

            const actualMessages = previousMessages.filter(
                (msg) => !msg.isLoading
            );

            const moduleId =
                "0x8d4e3c2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3";
            const content = await apiClient.getMemoryModule(moduleId);
            const initialMessagesLength = Object.keys(content).length;
            const isFirstNewMessage =
                actualMessages.length === initialMessagesLength + 1;

            if (isFirstNewMessage) {
                const chatHistory = actualMessages
                    .map((msg) => `${msg.user}: ${msg.text}`)
                    .join("\n");

                const messageWithHistory = `<chatlog>\n
                    Here is the previous chatlog for reference, act as if you are continuing the conversation and don't mention the chatlog.
                    \n${chatHistory}\n</chatlog>\n${message}`;

                const response = await apiClient.sendMessage(
                    agentId,
                    messageWithHistory,
                    selectedFile
                );
                return Array.isArray(response) ? [response[0]] : [response];
            }

            const response = await apiClient.sendMessage(
                agentId,
                message,
                selectedFile
            );
            return Array.isArray(response) ? [response[0]] : [response];
        },
        onSuccess: async (newMessages: ContentWithUser[]) => {
            // Format new messages consistently
            const formattedMessages = newMessages.map(msg => ({
                ...msg,
                user: msg.user === "system" ? "assistant" : msg.user,
                createdAt: Date.now(),
            }));

            // Update the messages in the UI
            queryClient.setQueryData(
                ["messages", agentId],
                (old: ContentWithUser[] = []) => [...old, ...formattedMessages]
            );

            // Prepare assistant messages for memory storage
            const moduleId = "0x8d4e3c2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3";
            const messagesToAppend = formattedMessages.reduce((acc, msg, index) => {
                // Create a unique key for each message
                const key = `message_${Date.now()}_${index}_assistant`;
                return {
                    ...acc,
                    [key]: {
                        text: msg.text,
                        user: msg.user,
                        createdAt: msg.createdAt,
                        attachments: msg.attachments,
                    }
                };
            }, {});

            await apiClient.appendMemoryModule(moduleId, messagesToAppend);
        },
        onError: (e) => {
            toast({
                variant: "destructive",
                title: "Unable to send message",
                description: e.message,
            });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file?.type.startsWith("image/")) {
            setSelectedFile(file);
        }
    };

    // Simplified query with memoized options
    const queryOptions = useMemo(() => ({
        queryKey: ["messages", agentId] as const,
        initialData: [] as ContentWithUser[],
        staleTime: Infinity, // Prevent unnecessary refetches
        onSuccess: (data: ContentWithUser[]) => {
            if (data.length > 0) {
                requestAnimationFrame(scrollToBottom);
            }
        },
    }), [agentId, scrollToBottom]);

    const { data: messages = [] } = useQuery(queryOptions);

    const transitions = useTransition(messages, {
        keys: (message) =>
            `${message.createdAt}-${message.user}-${message.text}`,
        from: { opacity: 0, transform: "translateY(50px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(10px)" },
    });

    const CustomAnimatedDiv = animated.div as React.FC<AnimatedDivProps>;

    return (
        <div className="flex flex-col w-full h-[calc(100dvh)] p-4">
            <div className="flex-1 overflow-y-auto">
                <ChatMessageList
                    scrollRef={scrollRef}
                    isAtBottom={isAtBottom}
                    scrollToBottom={scrollToBottom}
                    disableAutoScroll={disableAutoScroll}
                >
                    {transitions((style, message: ContentWithUser) => {
                        const variant = getMessageVariant(message?.user);
                        return (
                            <CustomAnimatedDiv
                                style={{
                                    ...style,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                    padding: "1rem",
                                }}
                            >
                                <ChatBubble
                                    variant={variant}
                                    className="flex flex-row items-center gap-2"
                                >
                                    {message?.user !== "user" ? (
                                        <Avatar className="size-8 p-1 border rounded-full select-none">
                                            <AvatarImage src="/elizaos-icon.png" />
                                        </Avatar>
                                    ) : null}
                                    <div className="flex flex-col">
                                        <ChatBubbleMessage
                                            isLoading={message?.isLoading}
                                        >
                                            {message?.user !== "user" ? (
                                                <AIWriter>
                                                    {cleanMessage(
                                                        message?.text
                                                    )}
                                                </AIWriter>
                                            ) : (
                                                cleanMessage(message?.text)
                                            )}
                                            <div>
                                                {message?.attachments?.map(
                                                    (
                                                        attachment: IAttachment
                                                    ) => (
                                                        <div
                                                            className="flex flex-col gap-1 mt-2"
                                                            key={`${attachment.url}-${attachment.title}`}
                                                        >
                                                            <img
                                                                alt="attachment"
                                                                src={
                                                                    attachment.url
                                                                }
                                                                width="100%"
                                                                height="100%"
                                                                className="w-64 rounded-md"
                                                            />
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span />
                                                                <span />
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </ChatBubbleMessage>
                                        <div className="flex items-center gap-4 justify-between w-full mt-1">
                                            {message?.text &&
                                            !message?.isLoading ? (
                                                <div className="flex items-center gap-1">
                                                    <CopyButton
                                                        text={message?.text}
                                                    />
                                                    <ChatTtsButton
                                                        agentId={agentId}
                                                        text={message?.text}
                                                    />
                                                </div>
                                            ) : null}
                                            <div
                                                className={cn([
                                                    message?.isLoading
                                                        ? "mt-2"
                                                        : "",
                                                    "flex items-center justify-between gap-4 select-none",
                                                ])}
                                            >
                                                {message?.source ? (
                                                    <Badge variant="outline">
                                                        {message.source}
                                                    </Badge>
                                                ) : null}
                                                {message?.action ? (
                                                    <Badge variant="outline">
                                                        {message.action}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </ChatBubble>
                            </CustomAnimatedDiv>
                        );
                    })}
                </ChatMessageList>
            </div>
            <div className="px-4 pb-4">
                <form
                    ref={formRef}
                    onSubmit={handleSendMessage}
                    className="relative rounded-md border bg-card"
                >
                    {selectedFile ? (
                        <div className="p-3 flex">
                            <div className="relative rounded-md border p-2">
                                <Button
                                    onClick={() => setSelectedFile(null)}
                                    className="absolute -right-2 -top-2 size-[22px] ring-2 ring-background"
                                    variant="outline"
                                    size="icon"
                                >
                                    <X />
                                </Button>
                                <img
                                    alt="Selected file"
                                    src={URL.createObjectURL(selectedFile)}
                                    height="100%"
                                    width="100%"
                                    className="aspect-square object-contain w-16"
                                />
                            </div>
                        </div>
                    ) : null}
                    <ChatInput
                        ref={inputRef}
                        onKeyDown={handleKeyDown}
                        value={input}
                        onChange={({ target }) => setInput(target.value)}
                        placeholder="Type your message here..."
                        className="min-h-12 resize-none rounded-md bg-card border-0 p-3 shadow-none focus-visible:ring-0"
                    />
                    <div className="flex items-center p-3 pt-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.click();
                                            }
                                        }}
                                    >
                                        <Paperclip className="size-4" />
                                        <span className="sr-only">
                                            Attach file
                                        </span>
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Attach file</p>
                            </TooltipContent>
                        </Tooltip>
                        <AudioRecorder
                            agentId={agentId}
                            onChange={(newInput: string) => setInput(newInput)}
                        />
                        <Button
                            disabled={!input || sendMessageMutation?.isPending}
                            type="submit"
                            size="sm"
                            className="ml-auto gap-1.5 h-[30px]"
                        >
                            {sendMessageMutation?.isPending
                                ? "..."
                                : "Send Message"}
                            <Send className="size-3.5" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
