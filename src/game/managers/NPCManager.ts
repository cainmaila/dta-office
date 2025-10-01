import { Scene } from "phaser";
import { NPC } from "../objects/NPC";
import type { NPCData } from "../types/NPCTypes";

export class NPCManager {
    private scene: Scene;
    private npcs: Map<string, NPC> = new Map();
    private npcData: NPCData[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
    }

    async loadNPCData(): Promise<void> {
        try {
            // 嘗試載入舊的NPC配置數據 (簡化版)
            const response = await fetch("assets/data/npcs.json");
            const data = await response.json();
            this.npcData = data.npcs;
            console.log("NPC data loaded:", this.npcData);
        } catch (error) {
            console.error("Failed to load NPC data:", error);
            // 使用預設數據作為備案
            this.npcData = this.getDefaultNPCData();
        }
    }

    private getDefaultNPCData(): NPCData[] {
        return [
            {
                id: "npc_001",
                name: "李經理",
                position: "產品經理",
                personality: "嚴謹負責",
                x: 300,
                y: 400,
                sprite: "npc-a",
                dialogue: "歡迎來到我們公司！有什麼可以幫助你的嗎？",
                npcType: "desk",
            },
            {
                id: "npc_002",
                name: "王設計師",
                position: "UI/UX設計師",
                personality: "創意滿滿",
                x: 500,
                y: 350,
                sprite: "npc-in",
                dialogue: "我正在設計新的用戶介面，你覺得這個顏色搭配怎麼樣？",
                npcType: "desk",
            },
        ];
    }

    createNPCs(): void {
        // 清理現有的NPCs
        this.clearNPCs();

        // 只創建站立類型的NPCs (desk 和 meeting 類型已由其他系統處理)
        const standingNPCs = this.npcData.filter(
            (data) => data.npcType === "standing"
        );

        standingNPCs.forEach((data) => {
            const npc = new NPC(this.scene, data);
            this.npcs.set(data.id, npc);
        });

        console.log(`Created ${this.npcs.size} standing NPCs in the scene`);
    }

    private clearNPCs(): void {
        this.npcs.forEach((npc) => {
            npc.destroy();
        });
        this.npcs.clear();
    }

    getNPC(id: string): NPC | undefined {
        return this.npcs.get(id);
    }

    getAllNPCs(): NPC[] {
        return Array.from(this.npcs.values());
    }

    updateNPCPosition(id: string, x: number, y: number): void {
        const npc = this.npcs.get(id);
        if (npc) {
            npc.x = x;
            npc.y = y;
            npc.setDepth(y); // 更新深度
        }
    }

    setNPCInteractive(id: string, interactive: boolean): void {
        const npc = this.npcs.get(id);
        if (npc) {
            npc.setNPCInteractive(interactive);
        }
    }

    destroy(): void {
        this.clearNPCs();
    }
}
