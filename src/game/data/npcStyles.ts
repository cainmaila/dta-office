/**
 * NPC 樣式配置 - 基於 npc.png 精靈圖集
 * 圖集結構: 13x11 網格, 每幀 78x93 像素, 共 143 幀
 */

export interface NPCStyleFrames {
    idle: number[]; // 靜止站立
    walking: number[]; // 行走
    sitting: number[]; // 坐著
    talking: number[]; // 說話
}

export interface NPCStyle {
    id: string;
    name: string;
    description: string;
    frames: NPCStyleFrames;
    recommendedFor: string[]; // 適合的職位
    defaultFrame: number; // 預設幀（通常是 idle 的第一幀）
}

/**
 * NPC 樣式庫
 * 所有樣式都使用 'npc' 精靈圖集
 */
export const NPC_STYLES: Record<string, NPCStyle> = {
    business_male_1: {
        id: "business_male_1",
        name: "商務男性 1",
        description: "穿著正式西裝的男性角色",
        frames: {
            idle: [0, 1, 2],
            walking: [13, 14, 15, 16],
            sitting: [26, 27],
            talking: [39, 40, 41],
        },
        recommendedFor: ["經理", "主管", "客戶", "總監"],
        defaultFrame: 0,
    },

    business_female_1: {
        id: "business_female_1",
        name: "商務女性 1",
        description: "穿著正式套裝的女性角色",
        frames: {
            idle: [3, 4, 5],
            walking: [17, 18, 19, 20],
            sitting: [28, 29],
            talking: [42, 43, 44],
        },
        recommendedFor: ["經理", "設計師", "專員", "主管"],
        defaultFrame: 3,
    },

    casual_male_1: {
        id: "casual_male_1",
        name: "休閒男性 1",
        description: "穿著休閒服裝的男性角色",
        frames: {
            idle: [6, 7, 8],
            walking: [21, 22, 23, 24],
            sitting: [30, 31],
            talking: [45, 46, 47],
        },
        recommendedFor: ["工程師", "實習生", "技術員", "開發者"],
        defaultFrame: 6,
    },

    casual_female_1: {
        id: "casual_female_1",
        name: "休閒女性 1",
        description: "穿著休閒服裝的女性角色",
        frames: {
            idle: [9, 10, 11],
            walking: [25, 26, 27, 28],
            sitting: [32, 33],
            talking: [48, 49, 50],
        },
        recommendedFor: ["設計師", "助理", "專員", "行政"],
        defaultFrame: 9,
    },
};
