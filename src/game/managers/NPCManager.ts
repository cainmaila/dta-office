import { Scene } from "phaser";
import { NPC } from "../objects/NPC";
import type {
    NPCData,
    CharactersData,
    Character,
    StandingNpcConfig,
} from "../types/NPCTypes";
import { gameConfig } from "../config";

export class NPCManager {
    private scene: Scene;
    private npcs: Map<string, NPC> = new Map();
    private characters: Map<string, Character> = new Map(); // 人物資料庫

    constructor(scene: Scene) {
        this.scene = scene;
    }

    async loadNPCData(): Promise<void> {
        const response = await fetch(
            `${gameConfig.assets.basePath}/data/characters.json`
        );
        const data: CharactersData = await response.json();

        // 建立人物資料庫
        data.characters.forEach((character) => {
            this.characters.set(character.id, character);
        });

        // 創建站立 NPC
        this.createStandingNPCs(data.standingNpcs);
    }

    private createStandingNPCs(configs: StandingNpcConfig[]): void {
        // 清理現有的NPCs
        this.clearNPCs();

        configs.forEach((config) => {
            const character = this.characters.get(config.characterId);
            if (!character) {
                console.warn(
                    `Character not found for standing NPC: ${config.characterId}`
                );
                return;
            }

            // 將新格式轉換為 NPC 物件所需的格式
            const npcData: NPCData = {
                id: character.id,
                name: character.name,
                position: character.position,
                dialogue: character.dialogue,
                x: config.x,
                y: config.y,
                styleId: config.styleId,
                action: config.action || "idle",
                facing: config.facing || "left", // 預設面向左
                npcType: "standing",
            };

            const npc = new NPC(this.scene, npcData);
            this.npcs.set(character.id, npc);
        });
    }

    createNPCs(): void {
        // 這個方法保留作為向後相容，實際創建在 loadNPCData 中完成
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

    getCharacter(id: string): Character | undefined {
        return this.characters.get(id);
    }

    getAllCharacters(): Character[] {
        return Array.from(this.characters.values());
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
