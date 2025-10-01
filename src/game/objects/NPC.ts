import { Scene } from "phaser";
import type { NPCData } from "../types/NPCTypes";
import { getStyleById, getFrameForAction } from "../utils/NPCStyleUtils";
import { gameConfig } from "../config";

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

    private createNameLabel(): void {
        if (!this.nameLabel) {
            this.nameLabel = this.scene.add.text(
                this.x,
                this.y - this.height * this.scaleY - 10,
                this.npcData.name,
                {
                    fontSize: "14px",
                    color: "#333333",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
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

    public showDialogue(): void {
        // 發送事件給對話管理器，增加對話框與人物的距離
        this.scene.events.emit("show-dialogue", {
            npcId: this.npcData.id,
            name: this.npcData.name,
            message: this.npcData.dialogue,
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
     * 切換 NPC 樣式
     * @param styleId 樣式 ID (例如: 'business_male_1', 'casual_female_1')
     * @param action 動作狀態 (預設為 'idle')
     */
    public setStyle(
        styleId: string,
        action: "idle" | "walking" | "sitting" | "talking" = "idle"
    ): this {
        const style = getStyleById(styleId);
        if (!style) {
            console.warn(`Style ${styleId} not found`);
            return this;
        }

        this.clearAnimationTimer();
        this.currentStyleId = styleId;
        this.currentAction = action;

        // 更新幀
        const frameIndex = getFrameForAction(styleId, action, 0);
        this.setFrame(frameIndex);

        // 更新資料
        this.npcData.styleId = styleId;
        this.npcData.action = action;

        return this;
    }

    /**
     * 切換動作狀態（使用當前樣式）
     * @param action 動作狀態
     * @param frameIndex 動作幀索引（可選，預設為 0）
     */
    public setAction(
        action: "idle" | "walking" | "sitting" | "talking",
        frameIndex: number = 0
    ): this {
        if (!this.currentStyleId) {
            console.warn("No style set for this NPC");
            return this;
        }

        this.clearAnimationTimer();
        this.currentAction = action;
        const frame = getFrameForAction(
            this.currentStyleId,
            action,
            frameIndex
        );
        this.setFrame(frame);

        this.npcData.action = action;

        return this;
    }

    /**
     * 獲取當前樣式資訊
     */
    public getCurrentStyle() {
        return this.currentStyleId
            ? getStyleById(this.currentStyleId)
            : undefined;
    }

    /**
     * 獲取當前動作
     */
    public getCurrentAction(): "idle" | "walking" | "sitting" | "talking" {
        return this.currentAction;
    }

    /**
     * 播放動作動畫（循環播放該動作的所有幀）
     * @param action 動作狀態
     * @param duration 每幀持續時間（毫秒）
     */
    public playActionAnimation(
        action: "idle" | "walking" | "sitting" | "talking",
        duration: number = 200
    ): this {
        if (!this.currentStyleId) {
            console.warn("No style set for this NPC");
            return this;
        }

        const style = getStyleById(this.currentStyleId);
        if (!style) return this;

        const frames = style.frames[action];
        if (!frames || frames.length === 0) return this;

        // 停止現有的動畫
        this.scene.tweens.killTweensOf(this);
        this.clearAnimationTimer();

        this.currentAction = action;
        let currentFrameIndex = 0;

        // 創建幀動畫循環
        const updateFrame = () => {
            this.setFrame(frames[currentFrameIndex]);
            currentFrameIndex = (currentFrameIndex + 1) % frames.length;
        };

        // 立即更新第一幀
        updateFrame();

        // 創建循環計時器
        this.animationTimer = this.scene.time.addEvent({
            delay: duration,
            callback: updateFrame,
            loop: true,
        });

        return this;
    }

    private clearAnimationTimer(): void {
        if (this.animationTimer) {
            this.animationTimer.remove(false);
            this.animationTimer = undefined;
        }
    }

    public destroy(fromScene?: boolean): void {
        // 清理事件監聽
        this.scene.events.off("dialogue-shown", this.onDialogueShown, this);
        this.scene.events.off("dialogue-hidden", this.onDialogueHidden, this);

        // 清理名字標籤
        if (this.nameLabel) {
            this.nameLabel.destroy();
            this.nameLabel = undefined;
        }
        this.clearAnimationTimer();
        super.destroy(fromScene);
    }
}
