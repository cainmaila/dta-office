import { Scene } from 'phaser';
import { base } from '$app/paths';

/**
 * 控制按鈕 UI（分享 & 重新輸入）
 */
export class ControlButtons {
    private scene: Scene;
    private shareButton: Phaser.GameObjects.DOMElement;
    private retryButton: Phaser.GameObjects.DOMElement;
    private currentTopic: string = '';
    private onRetryCallback?: () => void;

    constructor(scene: Scene) {
        this.scene = scene;

        // 建立分享按鈕
        this.shareButton = this.createButton('分享', 16, 16, () => {
            this.handleShare();
        });

        // 建立重新輸入按鈕（初始隱藏）
        this.retryButton = this.createButton('重新討論', 100, 16, () => {
            if (this.onRetryCallback) {
                this.onRetryCallback();
            }
        });
        this.retryButton.setVisible(false);
    }

    /**
     * 建立按鈕
     */
    private createButton(
        text: string,
        x: number,
        y: number,
        onClick: () => void
    ): Phaser.GameObjects.DOMElement {
        const buttonHtml = `
            <button style="
                padding: 8px 16px;
                font-size: 14px;
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-family: Arial, sans-serif;
                transition: background-color 0.2s;
                white-space: nowrap;
            ">${text}</button>
        `;

        const button = this.scene.add.dom(x, y, 'div')
            .createFromHTML(buttonHtml)
            .setOrigin(0, 0)
            .setDepth(9998)
            .setScrollFactor(0);

        const btnElement = button.node.querySelector('button') as HTMLButtonElement;

        if (btnElement) {
            btnElement.addEventListener('click', onClick);

            btnElement.addEventListener('mouseenter', () => {
                btnElement.style.backgroundColor = '#1976D2';
            });

            btnElement.addEventListener('mouseleave', () => {
                btnElement.style.backgroundColor = '#2196F3';
            });
        }

        return button;
    }

    /**
     * 處理分享
     */
    private async handleShare(): Promise<void> {
        const shareUrl = this.buildShareUrl();

        try {
            await navigator.clipboard.writeText(shareUrl);
            this.showCopiedFeedback();
        } catch (error) {
            console.error('複製失敗:', error);
            // Fallback: 使用 prompt 顯示網址
            prompt('請手動複製此網址：', shareUrl);
        }
    }

    /**
     * 建立分享網址
     */
    private buildShareUrl(): string {
        const baseUrl = window.location.origin;
        const basePath = base || '';

        if (!this.currentTopic) {
            return `${baseUrl}${basePath}/`;
        }

        const encodedTopic = encodeURIComponent(this.currentTopic);
        return `${baseUrl}${basePath}/?topic=${encodedTopic}`;
    }

    /**
     * 顯示「已複製」回饋
     */
    private showCopiedFeedback(): void {
        const btnElement = this.shareButton.node.querySelector('button') as HTMLButtonElement;
        if (!btnElement) return;

        const originalText = btnElement.textContent;
        const originalColor = btnElement.style.backgroundColor;

        btnElement.textContent = '已複製！';
        btnElement.style.backgroundColor = '#4CAF50';

        this.scene.time.delayedCall(1500, () => {
            btnElement.textContent = originalText || '分享';
            btnElement.style.backgroundColor = originalColor || '#2196F3';
        });
    }

    /**
     * 設定當前主題
     */
    setCurrentTopic(topic: string): void {
        this.currentTopic = topic;

        // 有主題時顯示重新輸入按鈕
        if (topic) {
            this.retryButton.setVisible(true);
        } else {
            this.retryButton.setVisible(false);
        }
    }

    /**
     * 設定重新輸入回調
     */
    onRetry(callback: () => void): void {
        this.onRetryCallback = callback;
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.shareButton.destroy();
        this.retryButton.destroy();
    }
}
