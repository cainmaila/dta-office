import type { HotspotNPC } from "../types/NPCTypes";

export const roundTableNpcs: HotspotNPC[] = [
    {
        id: "round_table_host",
        name: "主持人艾達",
        dialogue: "我們開始今天的策略討論吧。",
        x: 488,
        y: 500,
        radius: 40,
        bubbleOffsetY: -190,
    },
    {
        id: "round_table_marketing",
        name: "行銷專員小惠",
        dialogue: "本季活動的曝光數據已經整理好了！",
        x: 588,
        y: 504,
        radius: 40,
        bubbleOffsetY: -185,
    },
    {
        id: "round_table_analyst",
        name: "資料分析師可芸",
        dialogue: "使用者黏著度提高了 12%，值得分享。",
        x: 452,
        y: 585,
        radius: 40,
        bubbleOffsetY: -185,
    },
    {
        id: "round_table_tech",
        name: "技術顧問阿哲",
        dialogue: "新工具的 PoC 已經準備好，等你們試用。",
        x: 610,
        y: 610,
        radius: 40,
        bubbleOffsetY: -210,
    },
    {
        id: "round_table_coordinator",
        name: "專案協調師怡君",
        dialogue: "下午的跨部門同步別忘了，我已經寄出會議邀請。",
        x: 542,
        y: 634,
        radius: 40,
        bubbleOffsetY: -215,
    },
];
