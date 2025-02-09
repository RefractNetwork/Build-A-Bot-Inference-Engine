export interface MarketplaceModule {
    id: string;
    creator: string;
    creatorName: string;
    name: string;
    type: "character" | "knowledge" | "memory" | "speech" | "tone";
    description: string;
    url: string;
    thumbnailUrl: string;
    isPurchasable: boolean;
    price: number;
    walrusCertificate: string;
}

export interface ModuleUploadData {
    name: string;
    type: "character" | "knowledge" | "memory" | "speech" | "tone";
    description: string;
    imageUrl: string;
    content: string; // JSON string
}
