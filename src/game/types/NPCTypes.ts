export interface NPCData {
    id: string;
    name: string;
    position: string;
    personality: string;
    x: number;
    y: number;
    sprite?: string; // Legacy field, optional
    styleId?: string; // NPC 樣式 ID (對應 npcStyles.ts 中的樣式)
    frameIndex?: number; // 手動指定的幀索引（可選）
    action?: "idle" | "walking" | "sitting" | "talking"; // 當前動作狀態
    character_type?: string; // New field for character type mapping (optional for now)
    current_frame?: string; // Current animation frame state (optional for now)
    dialogue: string;
    npcType: "desk" | "standing" | "meeting";
}

export interface HotspotNPC {
    id: string;
    name: string;
    dialogue: string;
    x: number;
    y: number;
    radius: number;
    bubbleOffsetX?: number;
    bubbleGap?: number;
    bubbleOffsetY?: number;
}

export interface DialogueEventPayload {
    name: string;
    message: string;
    x: number;
    y: number;
    radius?: number;
    bubbleOffsetX?: number;
    bubbleOffsetY?: number;
    bubbleGap?: number;
}
