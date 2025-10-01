// 人物基本資料（與位置呈現方式解耦）
export interface Character {
    id: string; // 唯一識別碼
    name: string; // 姓名
    position: string; // 職稱
    personality: string; // 個性標籤
    dialogue: string; // 當前對話內容
    introduction: string; // 自我介紹（用於 LLM）
}

// 站立 NPC 配置（引用 Character ID）
export interface StandingNpcConfig {
    characterId: string; // 對應到 Character.id
    x: number; // 資料座標 X
    y: number; // 資料座標 Y
    styleId: string; // NPC 樣式 ID (對應 npcStyles.ts)
    action?: "idle" | "walking" | "sitting" | "talking"; // 當前動作狀態
}

// 熱區 NPC 配置（引用 Character ID）
export interface HotspotNpcConfig {
    characterId: string; // 對應到 Character.id
    x: number; // 資料座標 X
    y: number; // 資料座標 Y
    radius: number; // 熱區半徑
    bubbleOffsetX?: number;
    bubbleOffsetY?: number;
    bubbleGap?: number;
}

// 完整資料結構（從 characters.json 載入）
export interface CharactersData {
    characters: Character[];
    standingNpcs: StandingNpcConfig[];
    hotspotNpcs: HotspotNpcConfig[];
}

// ========== Legacy Types (保留以支援舊程式碼，逐步遷移) ==========

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
    npcId?: string; // NPC ID for tracking dialogue state
    name: string;
    message: string;
    x: number;
    y: number;
    radius?: number;
    bubbleOffsetX?: number;
    bubbleOffsetY?: number;
    bubbleGap?: number;
}
