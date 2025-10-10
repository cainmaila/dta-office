import { Scene } from "phaser";

export class DialogueBubble extends Phaser.GameObjects.Container {
    private background!: Phaser.GameObjects.Graphics;
    private textObject!: Phaser.GameObjects.Text;
    private tail!: Phaser.GameObjects.Graphics;
    private bubbleWidth: number = 0;
    private bubbleHeight: number = 0;
    private padding: number = 12;
    private cornerRadius: number = 8;
    private tailSize: number = 12;
    private bubbleType: 'normal' | 'thought';

    constructor(
        scene: Scene,
        x: number,
        y: number,
        message: string,
        npcX: number,
        npcY: number,
        type: 'normal' | 'thought' = 'normal'
    ) {
        super(scene, x, y);

        this.bubbleType = type;

        // 添加到場景
        scene.add.existing(this);

        // 創建對話氣泡
        this.createBubble(message, npcX, npcY);

        // 設置深度確保在最上層
        this.setDepth(2000);
    }

    public getBubbleHeight(): number {
        return this.bubbleHeight;
    }

    public getTailSize(): number {
        return this.tailSize;
    }

    private createBubble(message: string, npcX: number, npcY: number): void {
        // 創建文字物件來計算尺寸
        this.textObject = this.scene.add.text(0, 0, message, {
            fontSize: "14px",
            color: "#333333",
            fontFamily: "Arial",
            align: "left",
            wordWrap: { width: 200, useAdvancedWrap: true },
        });
        this.textObject.setOrigin(0.5, 0.5);

        // 計算氣泡尺寸（思考泡泡和普通對話框使用相同的計算方式）
        this.bubbleWidth = Math.max(
            this.textObject.width + this.padding * 2,
            80
        );
        this.bubbleHeight = this.textObject.height + this.padding * 2;

        // 創建背景圖形
        this.background = this.scene.add.graphics();

        // 根據類型選擇背景繪製方式
        if (this.bubbleType === 'thought') {
            this.drawCloudBackground();
        } else {
            this.drawBubbleBackground();
        }

        // 創建指向尾巴或思考圓圈
        this.tail = this.scene.add.graphics();
        if (this.bubbleType === 'thought') {
            this.drawThoughtBubbles();
        } else {
            this.drawTail(npcX, npcY);
        }

        // 添加到容器
        this.add([this.background, this.tail, this.textObject]);
    }

    private drawBubbleBackground(): void {
        this.background.clear();

        // 設置填充和邊框
        this.background.fillStyle(0xffffff, 1.0); // 白底
        this.background.lineStyle(2, 0x333333, 1.0); // 黑邊框

        // 計算氣泡位置
        const x = -this.bubbleWidth / 2;
        const y = -this.bubbleHeight / 2;

        // 創建一個包含尾巴的完整對話框形狀
        this.background.beginPath();

        // 繪製圓角矩形主體
        const radius = this.cornerRadius;

        // 從左上角開始，順時針繪製圓角矩形
        this.background.moveTo(x + radius, y);

        // 上邊 + 右上角
        this.background.lineTo(x + this.bubbleWidth - radius, y);
        this.background.arc(
            x + this.bubbleWidth - radius,
            y + radius,
            radius,
            -Math.PI / 2,
            0
        );

        // 右邊 + 右下角
        this.background.lineTo(
            x + this.bubbleWidth,
            y + this.bubbleHeight - radius
        );
        this.background.arc(
            x + this.bubbleWidth - radius,
            y + this.bubbleHeight - radius,
            radius,
            0,
            Math.PI / 2
        );

        // 下邊右側到尾巴位置
        const tailCenterX = 0; // 尾巴在中心位置
        const tailWidth = 16; // 尾巴底部寬度
        const tailBaseY = y + this.bubbleHeight;

        this.background.lineTo(tailCenterX + tailWidth / 2, tailBaseY);

        // 繪製尾巴右側到尖端
        this.background.lineTo(tailCenterX, tailBaseY + this.tailSize);

        // 繪製尾巴左側
        this.background.lineTo(tailCenterX - tailWidth / 2, tailBaseY);

        // 下邊左側 + 左下角
        this.background.lineTo(x + radius, tailBaseY);
        this.background.arc(
            x + radius,
            y + this.bubbleHeight - radius,
            radius,
            Math.PI / 2,
            Math.PI
        );

        // 左邊 + 左上角
        this.background.lineTo(x, y + radius);
        this.background.arc(
            x + radius,
            y + radius,
            radius,
            Math.PI,
            -Math.PI / 2
        );

        // 閉合路徑
        this.background.closePath();

        // 填充和描邊
        this.background.fillPath();
        this.background.strokePath();
    }

    private drawCloudBackground(): void {
        this.background.clear();

        // 設置填充和邊框
        this.background.fillStyle(0xffffff, 1.0); // 白底
        this.background.lineStyle(2, 0x333333, 1.0); // 黑邊框

        // 思考泡泡使用和普通對話框相同的圓角矩形
        // 計算氣泡位置
        const x = -this.bubbleWidth / 2;
        const y = -this.bubbleHeight / 2;

        // 繪製圓角矩形（不含尾巴）
        const radius = this.cornerRadius;

        this.background.beginPath();

        // 從左上角開始，順時針繪製圓角矩形
        this.background.moveTo(x + radius, y);

        // 上邊 + 右上角
        this.background.lineTo(x + this.bubbleWidth - radius, y);
        this.background.arc(
            x + this.bubbleWidth - radius,
            y + radius,
            radius,
            -Math.PI / 2,
            0
        );

        // 右邊 + 右下角
        this.background.lineTo(
            x + this.bubbleWidth,
            y + this.bubbleHeight - radius
        );
        this.background.arc(
            x + this.bubbleWidth - radius,
            y + this.bubbleHeight - radius,
            radius,
            0,
            Math.PI / 2
        );

        // 下邊 + 左下角
        this.background.lineTo(x + radius, y + this.bubbleHeight);
        this.background.arc(
            x + radius,
            y + this.bubbleHeight - radius,
            radius,
            Math.PI / 2,
            Math.PI
        );

        // 左邊 + 左上角
        this.background.lineTo(x, y + radius);
        this.background.arc(
            x + radius,
            y + radius,
            radius,
            Math.PI,
            -Math.PI / 2
        );

        // 閉合路徑
        this.background.closePath();

        // 填充和描邊
        this.background.fillPath();
        this.background.strokePath();
    }

    private drawTail(npcX: number, npcY: number): void {
        // 尾巴現在已經整合到主要氣泡中，保留空方法
        this.tail.clear();
    }

    private drawThoughtBubbles(): void {
        this.tail.clear();

        // 設置填充和邊框（與主氣泡一致）
        this.tail.fillStyle(0xffffff, 1.0); // 白底
        this.tail.lineStyle(2, 0x333333, 1.0); // 黑邊框

        // 計算起始位置（從氣泡底部中心開始）
        const startX = 0;
        const startY = this.bubbleHeight / 2;

        // 兩個不重疊的小圓圈，模仿想法往上飄的效果
        const bubbles = [
            { radius: 8, offsetY: 18 },   // 靠近對話框的圓圈（較大）
            { radius: 5, offsetY: 32 }    // 遠離對話框的圓圈（較小）
        ];

        // 繪製每個思考圓圈
        bubbles.forEach(bubble => {
            this.tail.beginPath();
            this.tail.arc(startX, startY + bubble.offsetY, bubble.radius, 0, Math.PI * 2);
            this.tail.closePath();
            this.tail.fillPath();
            this.tail.strokePath();
        });
    }

    public show(duration: number = 4000, onHideCallback?: () => void): void {
        // 顯示動畫 - 從小到大
        this.setScale(0);
        this.setAlpha(0);

        // 思考對話框的動畫速度較慢，使用更柔和的緩動函數
        if (this.bubbleType === 'thought') {
            // 想法框：慢速淡入（800ms），使用柔和的緩動
            this.scene.tweens.add({
                targets: this,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                duration: 800,
                ease: "Sine.easeOut", // 更柔和的緩動曲線
            });
        } else {
            // 普通對話框：快速彈出（200ms）
            this.scene.tweens.add({
                targets: this,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                duration: 200,
                ease: "Back.easeOut",
            });
        }

        // 自動隱藏 - 使用箭頭函數保持this上下文
        this.scene.time.delayedCall(
            duration,
            () => {
                this.hide(onHideCallback);
            },
            [],
            this
        );
    }

    public hide(onHideCallback?: () => void): void {
        if (!this.scene || !this.scene.tweens) {
            if (onHideCallback) onHideCallback();
            this.destroy();
            return;
        }

        // 隱藏動畫 - 淡出
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 150,
            ease: "Power2.easeIn",
            onComplete: () => {
                if (onHideCallback) onHideCallback();
                this.destroy();
            },
        });
    }

    destroy(): void {
        if (this.background) this.background.destroy();
        if (this.textObject) this.textObject.destroy();
        if (this.tail) this.tail.destroy();
        super.destroy();
    }
}
