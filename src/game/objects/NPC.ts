import { Scene } from "phaser";
import type { NPCData } from "../types/NPCTypes";

export class NPC extends Phaser.GameObjects.Sprite {
    public npcData: NPCData;
    private isInteractive: boolean = true;
    private nameLabel?: Phaser.GameObjects.Text;

    constructor(scene: Scene, npcData: NPCData) {
        // 使用sprite sheet作為備用，因為atlas可能有問題
        let textureKey = "npc-sheet";
        let frameKey = 0;

        // 將資料座標轉換為世界座標（如果場景有轉換方法）
        let worldX = npcData.x;
        let worldY = npcData.y;

        super(scene, worldX, worldY, textureKey, frameKey);

        this.npcData = npcData;

        // 添加到場景
        scene.add.existing(this);

        // 設置圖片屬性
        this.setOrigin(0.5, 1); // 底部中心為錨點
        this.setScale(1.0); // 使用原始大小
        this.setDepth(this.y); // 設置深度以實現正確的層級

        // 設置點擊區域
        this.setupInteraction();

        // 添加名字標籤
        this.createNameLabel();
    }

    private setupInteraction(): void {
        // 設置為可互動，Sprite 預設使用紋理作為互動區域
        this.setInteractive();

        // 添加點擊效果
        this.on("pointerover", () => {
            if (this.isInteractive) {
                this.setTint(0xdddddd); // 滑鼠懸停效果
                this.scene.input.setDefaultCursor("pointer");
            }
        });

        this.on("pointerout", () => {
            this.clearTint(); // 清除懸停效果
            this.scene.input.setDefaultCursor("default");
        });

        this.on("pointerdown", () => {
            if (this.isInteractive) {
                this.showDialogue();
            }
        });
    }

    private createNameLabel(): void {
        // 在NPC頭頂顯示名字（小字體）
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
    }

    public showDialogue(): void {
        // 發送事件給對話管理器，使用預設的對話氣泡位置
        this.scene.events.emit("show-dialogue", {
            name: this.npcData.name,
            message: this.npcData.dialogue,
            x: this.x,
            y: this.y - this.height * this.scaleY,
            bubbleOffsetY: -20,
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

    public destroy(fromScene?: boolean): void {
        // 清理名字標籤
        if (this.nameLabel) {
            this.nameLabel.destroy();
            this.nameLabel = undefined;
        }
        super.destroy(fromScene);
    }
}
