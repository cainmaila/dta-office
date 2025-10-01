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
        const provisionalX = anchorX + bubbleOffsetX;
        const provisionalY = anchorY;

        this.currentBubble = new DialogueBubble(
            this.scene,
            provisionalX,
            provisionalY,
            message,
            anchorX,
            anchorY
        );

        let targetY: number;

        if (typeof radius === "number") {
            const gap = bubbleGap ?? 12;
            const bubbleHeight = this.currentBubble.getBubbleHeight();
            const tailSize = this.currentBubble.getTailSize();
            const baseY = anchorY - radius - tailSize - bubbleHeight / 2 - gap;
            targetY = baseY + (bubbleOffsetY ?? 0);

            if ((import.meta as any).env?.DEV) {
                console.log(
                    `🧮 Bubble geometry -> height=${bubbleHeight.toFixed(
                        2
                    )} tail=${tailSize} calcBase=${baseY.toFixed(
                        2
                    )} gap=${gap} offsetY=${bubbleOffsetY ?? 0}`
                );
            }
        } else {
            // 站立 NPC：使用基礎偏移 + 額外偏移
            const baseOffset = -150; // 基礎偏移量
            const extraOffset = bubbleOffsetY ?? 0; // 額外偏移量
            targetY = anchorY + baseOffset + extraOffset;
        }

        const clampedX = Math.max(120, Math.min(anchorX + bubbleOffsetX, 904));
        const clampedY = Math.max(80, targetY);

        this.currentBubble.setPosition(clampedX, clampedY);

        console.log(
            `💬 Bubble placement -> ${name} anchor=(${anchorX}, ${anchorY}) radius=${
                radius ?? "n/a"
            } gap=${bubbleGap ?? "n/a"} offsets=(${bubbleOffsetX}, ${
                bubbleOffsetY ?? 0
            }) final=(${clampedX}, ${clampedY})`
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
