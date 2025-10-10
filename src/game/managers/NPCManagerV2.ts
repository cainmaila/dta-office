import { Scene } from "phaser";
import { NPCV2 } from "../objects/NPCV2";
import type {
    NPCData,
    CharactersData,
    Character,
    StandingNpcConfig,
} from "../types/NPCTypes";
import { gameConfig } from "../config";
import type { CharacterV2 } from "../../lib/api/teamDialogueV2";

/**
 * V2 版本的 NPC 管理器
 * 負責創建和管理 NPCV2 物件
 */
export class NPCManagerV2 {
    private scene: Scene;
    private npcs: Map<string, NPCV2> = new Map();
    private characters: Map<string, Character> = new Map(); // 人物資料庫

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * 載入 NPC 資料並創建站立 NPC
     */
    async loadNPCData(): Promise<CharactersData> {
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

        // 返回完整資料供 Scene 使用（包含 hotspotNpcs）
        return data;
    }

    /**
     * 使用 V2 API 的對話資料更新 NPC
     * 這個方法會將 API 返回的對話資料合併到角色資料中
     */
    public updateDialoguesFromAPI(apiCharacters: CharacterV2[]): void {
        apiCharacters.forEach((apiChar) => {
            const character = this.characters.get(apiChar.id);
            if (character) {
                // 將 V2 的 dialogues 存儲到角色資料中（作為擴展屬性）
                (character as any).dialogues = apiChar.dialogues;
                console.log(`✅ 已更新 ${apiChar.id} 的對話資料`);
            } else {
                console.warn(`⚠️ 找不到角色 ${apiChar.id}`);
            }
        });
    }

    private createStandingNPCs(configs: StandingNpcConfig[]): void {
        // 清理現有的NPCs
        this.clearNPCs();

        console.log(`🔧 V2: 準備創建 ${configs.length} 個站立 NPC`);

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
                dialogue: character.dialogue, // V1 的單一對話（V2 不使用這個欄位）
                x: config.x,
                y: config.y,
                styleId: config.styleId,
                action: config.action || "idle",
                facing: config.facing || "left",
                npcType: "standing",
            };

            const npc = new NPCV2(this.scene, npcData);
            this.npcs.set(character.id, npc);
            console.log(
                `✅ V2: 已創建 NPC ${character.id} at (${config.x}, ${config.y})`
            );
        });

        console.log(`✅ V2: 共創建 ${this.npcs.size} 個 NPC`);
    }

    private clearNPCs(): void {
        this.npcs.forEach((npc) => {
            npc.destroy();
        });
        this.npcs.clear();
    }

    getNPC(id: string): NPCV2 | undefined {
        return this.npcs.get(id);
    }

    getAllNPCs(): NPCV2[] {
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
            npc.updatePosition(x, y);
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
        this.characters.clear();
    }
}
