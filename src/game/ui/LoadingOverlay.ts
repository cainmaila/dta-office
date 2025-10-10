import { Scene } from "phaser";

/**
 * Loading 覆蓋層
 * 用於顯示載入中或錯誤訊息
 */
export class LoadingOverlay {
    private scene: Scene;
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Rectangle;
    private messageText: Phaser.GameObjects.Text;
    private spinner?: Phaser.GameObjects.Graphics;
    private spinnerTween?: Phaser.Tweens.Tween;

    constructor(scene: Scene) {
        this.scene = scene;

        // 建立容器（先創建，這樣可以把所有元素放進去）
        this.container = scene.add
            .container(0, 0)
            .setDepth(99999) // 提高深度確保在最上層
            .setScrollFactor(0)
            .setVisible(false);

        // 建立半透明黑色背景
        this.background = scene.add
            .rectangle(
                scene.scale.width / 2,
                scene.scale.height / 2,
                scene.scale.width,
                scene.scale.height,
                0x000000,
                0.8
            )
            .setOrigin(0.5);

        // 建立訊息文字
        this.messageText = scene.add
            .text(scene.scale.width / 2, scene.scale.height / 2, "", {
                fontSize: "24px",
                color: "#ffffff",
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                padding: { x: 24, y: 16 },
                align: "center",
                fontFamily: "Arial, sans-serif",
            })
            .setOrigin(0.5);

        // 將元素加入容器
        this.container.add([this.background, this.messageText]);

        // 監聽視窗大小改變
        scene.scale.on("resize", this.handleResize, this);
    }

    /**
     * 顯示載入中訊息（帶旋轉動畫）
     */
    showLoading(message: string = "需求討論中.."): void {
        this.messageText.setText(message);
        this.container.setVisible(true);

        // 建立旋轉動畫
        this.createSpinner();
    }

    /**
     * 顯示錯誤訊息（無動畫）
     */
    showError(message: string = "提案失敗", duration: number = 2000): void {
        this.removeSpinner();
        this.messageText.setText(message);
        this.container.setVisible(true);

        // 自動隱藏
        this.scene.time.delayedCall(duration, () => {
            this.hide();
        });
    }

    /**
     * 隱藏覆蓋層
     */
    hide(): void {
        this.container.setVisible(false);
        this.removeSpinner();
    }

    /**
     * 建立旋轉動畫
     */
    private createSpinner(): void {
        this.removeSpinner();

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2 - 60;

        // 創建 spinner，繪製在相對於自身的座標 (0, 0)
        this.spinner = this.scene.add.graphics();

        // 繪製多層圓環效果
        // 外層圓環（裝飾）
        this.spinner.lineStyle(2, 0x4caf50, 0.3);
        this.spinner.beginPath();
        this.spinner.arc(0, 0, 38, 0, Math.PI * 2, false);
        this.spinner.strokePath();

        // 主圓環
        this.spinner.lineStyle(5, 0x4caf50, 1);
        this.spinner.beginPath();
        this.spinner.arc(0, 0, 30, 0, Math.PI * 1.5, false);
        this.spinner.strokePath();

        // 內層裝飾點
        this.spinner.fillStyle(0x4caf50, 0.8);
        this.spinner.fillCircle(0, -30, 6);

        // 添加發光效果的小點
        this.spinner.fillStyle(0xffffff, 0.9);
        this.spinner.fillCircle(0, -30, 3);

        // 設置位置並加入容器
        this.spinner.setPosition(centerX, centerY);
        this.container.add(this.spinner);

        // 旋轉動畫 - 更平滑
        this.spinnerTween = this.scene.tweens.add({
            targets: this.spinner,
            angle: 360,
            duration: 1200,
            repeat: -1,
            ease: "Linear",
        });
    }
    /**
     * 移除旋轉動畫
     */
    private removeSpinner(): void {
        if (this.spinnerTween) {
            this.spinnerTween.remove();
            this.spinnerTween = undefined;
        }

        if (this.spinner) {
            this.spinner.destroy();
            this.spinner = undefined;
        }
    }

    /**
     * 處理視窗大小改變
     */
    private handleResize(gameSize: Phaser.Structs.Size): void {
        // 更新背景大小和位置
        this.background.setSize(gameSize.width, gameSize.height);
        this.background.setPosition(gameSize.width / 2, gameSize.height / 2);

        // 更新訊息文字位置
        this.messageText.setPosition(gameSize.width / 2, gameSize.height / 2);

        // 更新 spinner 位置
        if (this.spinner) {
            this.spinner.setPosition(
                gameSize.width / 2,
                gameSize.height / 2 - 60
            );
        }
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.scene.scale.off("resize", this.handleResize, this);
        this.removeSpinner();
        this.container.destroy();
    }
}
