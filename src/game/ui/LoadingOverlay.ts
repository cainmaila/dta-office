import { Scene } from 'phaser';

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

        // 建立半透明黑色背景
        this.background = scene.add.rectangle(
            0, 0,
            scene.scale.width,
            scene.scale.height,
            0x000000,
            0.7
        )
        .setOrigin(0, 0)
        .setScrollFactor(0);

        // 建立訊息文字
        this.messageText = scene.add.text(
            scene.scale.width / 2,
            scene.scale.height / 2,
            '',
            {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: { x: 24, y: 16 },
                align: 'center'
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0);

        // 建立容器
        this.container = scene.add.container(0, 0, [
            this.background,
            this.messageText
        ])
        .setDepth(10000)
        .setVisible(false);

        // 監聽視窗大小改變
        scene.scale.on('resize', this.handleResize, this);
    }

    /**
     * 顯示載入中訊息（帶旋轉動畫）
     */
    showLoading(message: string = '需求討論中..'): void {
        this.messageText.setText(message);
        this.container.setVisible(true);

        // 建立旋轉動畫
        this.createSpinner();
    }

    /**
     * 顯示錯誤訊息（無動畫）
     */
    showError(message: string = '提案失敗', duration: number = 2000): void {
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

        this.spinner = this.scene.add.graphics()
            .setScrollFactor(0);

        // 繪製圓形進度條
        this.spinner.lineStyle(4, 0xffffff, 1);
        this.spinner.beginPath();
        this.spinner.arc(centerX, centerY, 30, 0, Math.PI * 1.5, false);
        this.spinner.strokePath();

        this.container.add(this.spinner);

        // 旋轉動畫
        this.spinnerTween = this.scene.tweens.add({
            targets: this.spinner,
            angle: 360,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
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
        this.background.setSize(gameSize.width, gameSize.height);
        this.messageText.setPosition(gameSize.width / 2, gameSize.height / 2);

        if (this.spinner) {
            this.spinner.setPosition(gameSize.width / 2, gameSize.height / 2 - 60);
        }
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.scene.scale.off('resize', this.handleResize, this);
        this.removeSpinner();
        this.container.destroy();
    }
}
