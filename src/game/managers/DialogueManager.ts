import { Scene } from "phaser";
import { DialogueBubble } from "../objects/DialogueBubble";
import type { DialogueEventPayload } from "../types/NPCTypes";

export class DialogueManager {
    private scene: Scene;
    private currentBubble: DialogueBubble | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // 監聽NPC的對話事件
        this.scene.events.on("show-dialogue", (data: DialogueEventPayload) => {
            this.showDialogue(
                data.name,
                data.message,
                data.x,
                data.y,
                data.bubbleOffsetX,
                data.bubbleOffsetY
            );
        });
    }

    public showDialogue(
        name: string,
        message: string,
        anchorX: number,
        anchorY: number,
        bubbleOffsetX: number = 0,
        bubbleOffsetY: number = -150
    ): void {
        // 如果已有對話氣泡，先移除
        this.hideCurrentBubble();

        // 計算氣泡位置 - 在指定位置上方
        const bubbleX = anchorX + bubbleOffsetX;
        const bubbleY = anchorY + bubbleOffsetY;

        // 確保氣泡不超出螢幕邊界
        const adjustedX = Math.max(120, Math.min(bubbleX, 904)); // 120到904像素範圍
        const adjustedY = Math.max(80, bubbleY); // 至少在螢幕上方80像素

        // 創建新的對話氣泡
        this.currentBubble = new DialogueBubble(
            this.scene,
            adjustedX,
            adjustedY,
            message,
            anchorX,
            anchorY
        );

        // 顯示氣泡
        this.currentBubble.show(4000); // 4秒後自動消失
    }

    private hideCurrentBubble(): void {
        if (this.currentBubble) {
            this.currentBubble.hide();
            this.currentBubble = null;
        }
    }

    public destroy(): void {
        this.hideCurrentBubble();
        this.scene.events.off("show-dialogue");
    }
}
