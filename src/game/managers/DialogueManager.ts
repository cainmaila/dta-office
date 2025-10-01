import { Scene } from "phaser";
import { DialogueBubble } from "../objects/DialogueBubble";
import type { DialogueEventPayload } from "../types/NPCTypes";
import { computeBubblePosition } from "../utils/DialogueUtils";

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
            this.showDialogue(data);
        });
    }

    public showDialogue(payload: DialogueEventPayload): void {
        const {
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
