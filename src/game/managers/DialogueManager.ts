import { Scene } from "phaser";
import { DialogueBubble } from "../objects/DialogueBubble";
import type { DialogueEventPayload } from "../types/NPCTypes";
import { computeBubblePosition } from "../utils/DialogueUtils";

export class DialogueManager {
    private scene: Scene;
    private currentBubble: DialogueBubble | null = null;
    private currentNpcId?: string;

    constructor(scene: Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // 監聽NPC的對話事件
        this.scene.events.on("show-dialogue", (data: DialogueEventPayload) => {
            this.showDialogue(data);
        });
    }

    public showDialogue(payload: DialogueEventPayload): void {
        const {
            npcId,
            name,
            message,
            x: anchorX,
            y: anchorY,
            radius,
            bubbleOffsetX = 0,
            bubbleOffsetY,
            bubbleGap,
        } = payload;

        // 如果已有對話氣泡，先移除
        this.hideCurrentBubble();

        // 記錄當前對話的 NPC ID
        this.currentNpcId = npcId;

        // 通知對話開始
        if (npcId) {
            this.scene.events.emit("dialogue-shown", npcId);
        }

        // 創建新的對話氣泡
        this.currentBubble = new DialogueBubble(
            this.scene,
            anchorX,
            anchorY,
            message,
            anchorX,
            anchorY
        );

        const bubbleHeight = this.currentBubble.getBubbleHeight();
        const tailSize = this.currentBubble.getTailSize();

        const { x: finalX, y: finalY } = computeBubblePosition(payload, {
            height: bubbleHeight,
            tailSize,
        });

        this.currentBubble.setPosition(finalX, finalY);

        // 顯示氣泡，並在隱藏時通知
        this.currentBubble.show(4000, () => {
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

    public destroy(): void {
        this.hideCurrentBubble();
        this.scene.events.off("show-dialogue");
    }
}
