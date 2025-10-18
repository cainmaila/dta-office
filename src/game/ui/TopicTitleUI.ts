import { Scene } from "phaser";

/**
 * 主題標題 UI
 * 在遊戲上方顯示當前討論主題
 */
export class TopicTitleUI {
    private scene: Scene;
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Graphics;
    private titleText: Phaser.GameObjects.Text;
    private currentTopic: string = "";

    constructor(scene: Scene) {
        this.scene = scene;

        // 創建容器
        this.container = scene.add
            .container(0, 0)
            .setDepth(9998)
            .setScrollFactor(0);

        // 創建背景
        this.background = scene.add.graphics();
        this.container.add(this.background);

        // 創建標題文字
        this.titleText = scene.add
            .text(0, 0, "", {
                fontSize: "28px",
                color: "#ffffff",
                fontFamily: "Arial, sans-serif",
                fontStyle: "bold",
                align: "center",
                wordWrap: { width: 800 },
            })
            .setOrigin(0.5);
        this.container.add(this.titleText);

        // 初始隱藏
        this.container.setVisible(false);

        // 監聽視窗大小改變
        scene.scale.on("resize", this.handleResize, this);

        // 初始位置
        this.updatePosition();
    }

    /**
     * 設定主題並顯示
     */
    setTopic(topic: string): void {
        this.currentTopic = topic;
        this.titleText.setText(`${topic}`);

        // 更新背景大小
        this.updateBackground();

        // 顯示
        this.container.setVisible(true);

        // 添加掉落動畫
        this.playDropAnimation();
    }

    /**
     * 更新背景
     */
    private updateBackground(): void {
        const paddingX = 40;
        const paddingY = 20;
        const width = this.titleText.width + paddingX * 2;
        const height = this.titleText.height + paddingY * 2;

        this.background.clear();

        // 添加陰影效果（多層漸層）
        this.background.fillStyle(0x000000, 0.3);
        this.background.fillRoundedRect(
            -width / 2 + 4,
            -height / 2 + 4,
            width,
            height,
            16
        );

        // 主背景 - 漸層效果
        this.background.fillGradientStyle(
            0x1a1a1a,
            0x1a1a1a,
            0x0d0d0d,
            0x0d0d0d,
            1
        );
        this.background.fillRoundedRect(
            -width / 2,
            -height / 2,
            width,
            height,
            16
        );

        // 頂部高光
        this.background.fillStyle(0xffffff, 0.1);
        this.background.fillRoundedRect(
            -width / 2,
            -height / 2,
            width,
            height * 0.4,
            16
        );

        // 添加雙層邊框 - 外層
        this.background.lineStyle(1, 0x4caf50, 0.3);
        this.background.strokeRoundedRect(
            -width / 2 - 1,
            -height / 2 - 1,
            width + 2,
            height + 2,
            16
        );

        // 添加邊框 - 內層（主邊框）
        this.background.lineStyle(2, 0x4caf50, 0.8);
        this.background.strokeRoundedRect(
            -width / 2,
            -height / 2,
            width,
            height,
            16
        );

        // 左上角裝飾光點
        this.background.fillStyle(0x4caf50, 0.6);
        this.background.fillCircle(-width / 2 + 16, -height / 2 + 16, 3);
    }

    /**
     * 更新位置
     */
    private updatePosition(): void {
        const x = this.scene.scale.width / 2;
        const y = 100; // 調整到 100，避免標題過長時擋到上方按鈕
        this.container.setPosition(x, y);
    }

    /**
     * 播放掉落動畫
     */
    private playDropAnimation(): void {
        const finalX = this.scene.scale.width / 2;
        const finalY = 100;
        const startY = -100; // 從螢幕上方外開始

        // 設定初始位置（上方外）
        this.container.setPosition(finalX, startY);
        this.container.setAlpha(0);

        // 使用 Phaser Tween 創建掉落動畫
        this.scene.tweens.add({
            targets: this.container,
            y: finalY,
            alpha: 1,
            duration: 600,
            ease: "Back.easeOut", // 使用彈性緩動效果
            onComplete: () => {
                // 添加輕微的彈跳效果
                this.scene.tweens.add({
                    targets: this.container,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    yoyo: true,
                    ease: "Sine.easeInOut",
                });
            },
        });
    }

    /**
     * 隱藏
     */
    hide(): void {
        this.container.setVisible(false);
        this.currentTopic = "";
    }

    /**
     * 顯示
     */
    show(): void {
        if (this.currentTopic) {
            this.container.setVisible(true);
        }
    }

    /**
     * 獲取當前主題
     */
    getTopic(): string {
        return this.currentTopic;
    }

    /**
     * 處理視窗大小改變
     */
    private handleResize(): void {
        this.updatePosition();
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.scene.scale.off("resize", this.handleResize, this);
        this.container.destroy();
    }
}
