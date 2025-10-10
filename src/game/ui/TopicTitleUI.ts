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
                fontSize: "20px",
                color: "#ffffff",
                fontFamily: "Arial, sans-serif",
                fontStyle: "bold",
                align: "center",
                wordWrap: { width: 600 },
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
    }

    /**
     * 更新背景
     */
    private updateBackground(): void {
        const padding = 20;
        const width = this.titleText.width + padding * 2;
        const height = this.titleText.height + padding;

        this.background.clear();
        this.background.fillStyle(0x000000, 0.8);
        this.background.fillRoundedRect(
            -width / 2,
            -height / 2,
            width,
            height,
            8
        );

        // 添加邊框
        this.background.lineStyle(2, 0x4caf50, 1);
        this.background.strokeRoundedRect(
            -width / 2,
            -height / 2,
            width,
            height,
            8
        );
    }

    /**
     * 更新位置
     */
    private updatePosition(): void {
        const x = this.scene.scale.width / 2;
        const y = 40;
        this.container.setPosition(x, y);
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
