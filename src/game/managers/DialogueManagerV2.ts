import { Scene } from "phaser";
import { DialogueBubble } from "../objects/DialogueBubble";
import type { DialogueEventPayload } from "../types/NPCTypes";
import { computeBubblePosition } from "../utils/DialogueUtils";
import type { CharacterV2 } from "../../lib/api/teamDialogueV2";

/**
 * V2 版本的對話管理器
 * 核心功能：管理每個 NPC 的點擊次數，根據次數顯示對應的對話
 */
export class DialogueManagerV2 {
    private scene: Scene;
    private currentBubble: DialogueBubble | null = null;
    private currentNpcId?: string;

    // 儲存所有角色的對話資料 (key: npcId, value: 3 則對話)
    private characterDialogues: Map<string, [string, string, string]> =
        new Map();

    // 追蹤每個 NPC 的點擊次數 (key: npcId, value: 點擊次數)
    private clickCounts: Map<string, number> = new Map();

    constructor(scene: Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // 監聽 V2 NPC 的對話事件
        this.scene.events.on(
            "show-dialogue-v2",
            (data: DialogueEventPayload) => {
                this.showDialogueV2(data);
            }
        );
    }

    /**
     * 設定角色對話資料（從 API 載入）
     */
    public setCharacterDialogues(characters: CharacterV2[]): void {
        this.characterDialogues.clear();
        this.clickCounts.clear();

        characters.forEach((char) => {
            this.characterDialogues.set(char.id, char.dialogues);
            this.clickCounts.set(char.id, 0); // 初始化點擊次數為 0
        });

        console.log(
            `📚 DialogueManagerV2: 已載入 ${characters.length} 個角色的對話`
        );
    }

    /**
     * V2 對話顯示邏輯
     */
    public showDialogueV2(payload: DialogueEventPayload): void {
        const { npcId } = payload;

        if (!npcId) {
            console.warn("⚠️ DialogueManagerV2: 沒有提供 npcId");
            return;
        }

        // 檢查是否有這個角色的對話資料
        const dialogues = this.characterDialogues.get(npcId);
        if (!dialogues) {
            console.warn(`⚠️ DialogueManagerV2: 找不到 ${npcId} 的對話資料`);
            return;
        }

        // 如果點擊的是不同的 NPC，重置當前 NPC 的計數（因為不是連續點擊）
        if (this.currentNpcId && this.currentNpcId !== npcId) {
            // 重置新點擊的 NPC 的計數（因為不是連續點擊）
            this.clickCounts.set(npcId, 0);
            console.log(`🔄 點擊了不同的 NPC，重置 ${npcId} 的點擊計數為 0`);
        }

        // 獲取當前 NPC 的點擊次數
        const currentCount = this.clickCounts.get(npcId) || 0;

        // 根據點擊次數決定顯示哪則對話
        // 0 → dialogues[0], 1 → dialogues[1], 2+ → dialogues[2]
        const dialogueIndex = Math.min(currentCount, 2);
        const message = dialogues[dialogueIndex];

        // 決定對話類型和顯示時間
        // 第 3 則對話（index 2）使用內心想法形式，顯示時間更長
        const dialogueType: 'normal' | 'thought' = dialogueIndex === 2 ? 'thought' : 'normal';
        const displayDuration = dialogueIndex === 2 ? 6000 : 4000;

        console.log(
            `💬 ${npcId} 點擊次數: ${currentCount} → 顯示對話 ${dialogueIndex} (${dialogueType}): "${message.substring(
                0,
                20
            )}..."`
        );

        // 增加點擊次數（下次點擊會顯示下一則）
        // 但在達到第 3 則對話後，計數不再增加（保持在 2）
        if (currentCount < 2) {
            this.clickCounts.set(npcId, currentCount + 1);
        }

        // 如果已有對話氣泡，先移除
        this.hideCurrentBubble();

        // 記錄當前對話的 NPC ID
        this.currentNpcId = npcId;

        // 通知對話開始
        this.scene.events.emit("dialogue-shown", npcId);

        // 創建新的對話氣泡（使用選定的對話）
        const { x: anchorX, y: anchorY } = payload;

        this.currentBubble = new DialogueBubble(
            this.scene,
            anchorX,
            anchorY,
            message, // 顯示根據點擊次數選擇的對話
            anchorX,
            anchorY,
            dialogueType // 傳遞對話類型（normal 或 thought）
        );

        const bubbleHeight = this.currentBubble.getBubbleHeight();
        const tailSize = this.currentBubble.getTailSize();

        const { x: finalX, y: finalY } = computeBubblePosition(payload, {
            height: bubbleHeight,
            tailSize,
        });

        this.currentBubble.setPosition(finalX, finalY);

        // 顯示氣泡，並在隱藏時通知
        // 使用根據對話類型決定的顯示時間（normal: 4000ms, thought: 6000ms）
        this.currentBubble.show(displayDuration, () => {
            if (this.currentNpcId) {
                this.scene.events.emit("dialogue-hidden", this.currentNpcId);
            }
            this.currentNpcId = undefined;
        });
    }

    private hideCurrentBubble(): void {
        if (this.currentBubble) {
            // 通知對話結束
            if (this.currentNpcId) {
                this.scene.events.emit("dialogue-hidden", this.currentNpcId);
            }
            this.currentBubble.hide();
            this.currentBubble = null;
            this.currentNpcId = undefined;
        }
    }

    /**
     * 重置所有 NPC 的點擊計數（可選功能）
     */
    public resetAllClickCounts(): void {
        this.clickCounts.forEach((_, npcId) => {
            this.clickCounts.set(npcId, 0);
        });
        console.log("🔄 已重置所有 NPC 的點擊計數");
    }

    /**
     * 取得特定 NPC 的當前點擊次數（除錯用）
     */
    public getClickCount(npcId: string): number {
        return this.clickCounts.get(npcId) || 0;
    }

    public destroy(): void {
        this.hideCurrentBubble();
        this.scene.events.off("show-dialogue-v2");
        this.characterDialogues.clear();
        this.clickCounts.clear();
    }
}
