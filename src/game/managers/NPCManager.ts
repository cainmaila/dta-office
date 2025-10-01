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
        const response = await fetch("assets/data/npcs.json");
        const data = await response.json();
        this.npcData = data.npcs;
        console.log("NPC data loaded:", this.npcData);
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

    /**
     * 切換 NPC 樣式
     */
    setNPCStyle(
        id: string,
        styleId: string,
        action: "idle" | "walking" | "sitting" | "talking" = "idle"
    ): void {
        const npc = this.npcs.get(id);
        if (npc) {
            npc.setStyle(styleId, action);
        }
    }

    /**
     * 切換 NPC 動作
     */
    setNPCAction(
        id: string,
        action: "idle" | "walking" | "sitting" | "talking"
    ): void {
        const npc = this.npcs.get(id);
        if (npc) {
            npc.setAction(action);
        }
    }

    /**
     * 播放 NPC 動作動畫
     */
    playNPCAnimation(
        id: string,
        action: "idle" | "walking" | "sitting" | "talking",
        duration: number = 200
    ): void {
        const npc = this.npcs.get(id);
        if (npc) {
            npc.playActionAnimation(action, duration);
        }
    }

    destroy(): void {
        this.clearNPCs();
    }
}
