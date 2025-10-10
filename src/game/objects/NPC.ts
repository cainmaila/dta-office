import { Scene } from "phaser";
import type { NPCData } from "../types/NPCTypes";
import { getStyleById, getFrameForAction } from "../utils/NPCStyleUtils";
import { gameConfig } from "../config";

/**
 * NPC 類別
 * 支援 3 則對話，由 DialogueManager 管理點擊計數
 */
export class NPC extends Phaser.GameObjects.Sprite {
    public npcData: NPCData;
    private isInteractive: boolean = true;
    private nameLabel?: Phaser.GameObjects.Text;
    private currentStyleId?: string;
    private currentAction: "idle" | "walking" | "sitting" | "talking" = "idle";
    private animationTimer?: Phaser.Time.TimerEvent;
    private isHovering: boolean = false;
    private isDialogueActive: boolean = false;

    constructor(scene: Scene, npcData: NPCData) {
        // 決定使用哪個紋理和幀
        let textureKey = "npc-sheet";
        let frameKey = 0;

        // 如果指定了樣式 ID，使用樣式系統
        if (npcData.styleId) {
            const style = getStyleById(npcData.styleId);
            if (style) {
                textureKey = "npc-sheet"; // 所有樣式都使用 npc.png
                const action = npcData.action || "idle";
                frameKey = getFrameForAction(npcData.styleId, action, 0);
            }
        } else if (npcData.frameIndex !== undefined) {
            // 如果手動指定幀索引
            frameKey = npcData.frameIndex;
        }

        // 將資料座標轉換為世界座標（如果場景有轉換方法）
        let worldX = npcData.x;
        let worldY = npcData.y;

        super(scene, worldX, worldY, textureKey, frameKey);

        this.npcData = npcData;
        this.currentStyleId = npcData.styleId;
        this.currentAction = npcData.action || "idle";

        // 添加到場景
        scene.add.existing(this);

        // 設置圖片屬性
        this.setOrigin(0.5, 1); // 底部中心為錨點
        this.setScale(1.0); // 使用原始大小
        this.setDepth(this.y); // 設置深度以實現正確的層級

        // 設置面向方向
        this.applyFacing(npcData.facing || "left");

        // 設置點擊區域
        this.setupInteraction();

        // 監聽對話事件
        this.scene.events.on("dialogue-shown", this.onDialogueShown, this);
        this.scene.events.on("dialogue-hidden", this.onDialogueHidden, this);
    }

    private setupInteraction(): void {
        // 設置為可互動，Sprite 預設使用紋理作為互動區域
        this.setInteractive();

        // 添加點擊效果
        this.on("pointerover", () => {
            if (this.isInteractive) {
                this.setTint(0xdddddd); // 滑鼠懸停效果
                this.scene.input.setDefaultCursor("pointer");
                this.isHovering = true;
                this.updateNameLabelVisibility();
            }
        });

        this.on("pointerout", () => {
            this.clearTint(); // 清除懸停效果
            this.scene.input.setDefaultCursor("default");
            this.isHovering = false;
            this.updateNameLabelVisibility();
        });

        this.on("pointerdown", () => {
            if (this.isInteractive) {
                this.showDialogue();
            }
        });
    }

    /**
     * 設置 NPC 面向方向
     * @param facing "left" (面向左) 或 "right" (面向右)
     */
    private applyFacing(facing: "left" | "right"): void {
        if (facing === "left") {
            this.setScale(-1, 1); // 水平翻轉 (面向左)
        } else {
            this.setScale(1, 1); // 正常 (面向右)
        }
    }

    private createNameLabel(): void {
        if (!this.nameLabel) {
            this.nameLabel = this.scene.add.text(
                this.x,
                this.y - this.height * this.scaleY - 10,
                this.npcData.name,
                {
                    fontSize: "14px",
                    color: "#0b1f66",
                    fontFamily: "Arial",
                    fontStyle: "bold",
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    padding: { x: 6, y: 3 },
                }
            );
            this.nameLabel.setOrigin(0.5);
            this.nameLabel.setDepth(this.depth + 1);
            this.nameLabel.setVisible(false); // 初始隱藏
        }
    }

    private updateNameLabelVisibility(): void {
        const shouldShow = this.isHovering || this.isDialogueActive;

        if (shouldShow && !this.nameLabel) {
            this.createNameLabel();
        }

        if (this.nameLabel) {
            this.nameLabel.setVisible(shouldShow);
        }
    }

    private onDialogueShown(npcId: string): void {
        if (npcId === this.npcData.id) {
            this.isDialogueActive = true;
            this.updateNameLabelVisibility();
        }
    }

    private onDialogueHidden(npcId: string): void {
        if (npcId === this.npcData.id) {
            this.isDialogueActive = false;
            this.updateNameLabelVisibility();
        }
    }

    /**
     * 檢查此 NPC 的對話是否正在顯示
     */
    public isShowingDialogue(): boolean {
        return this.isDialogueActive;
    }

    /**
     * 觸發對話顯示（不傳遞具體對話內容，由 DialogueManager 處理）
     */
    public showDialogue(): void {
        // 發送事件給 DialogueManager，由它根據點擊次數決定顯示哪則對話
        this.scene.events.emit("show-dialogue", {
            npcId: this.npcData.id,
            name: this.npcData.name,
            x: this.x,
            y: this.y - this.height * this.scaleY,
            bubbleOffsetY: gameConfig.dialogue.standing.extraOffsetY,
            bubbleGap: gameConfig.dialogue.standing.bubbleGap,
        });

        // 添加點擊反饋效果
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.1,
            scaleY: this.scaleY * 1.1,
            duration: 100,
            yoyo: true,
            ease: "Power2",
        });
    }

    public setNPCInteractive(interactive: boolean = true): this {
        this.isInteractive = interactive;
        if (interactive) {
            if (!this.input) {
                this.setInteractive();
            }
        } else {
            this.disableInteractive();
        }
        return this;
    }

    /**
     * 更新位置（包括名牌）
     */
    public updatePosition(x: number, y: number): void {
        this.setPosition(x, y);
        this.setDepth(y);

        if (this.nameLabel) {
            this.nameLabel.setPosition(x, y - this.height * this.scaleY - 10);
        }
    }

    public destroy(fromScene?: boolean): void {
        // 清理事件監聽
        this.scene.events.off("dialogue-shown", this.onDialogueShown, this);
        this.scene.events.off("dialogue-hidden", this.onDialogueHidden, this);

        // 清理動畫計時器
        if (this.animationTimer) {
            this.animationTimer.destroy();
        }

        // 清理名牌
        if (this.nameLabel) {
            this.nameLabel.destroy();
        }

        super.destroy(fromScene);
    }
}
