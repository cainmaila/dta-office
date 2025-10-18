import { Scene } from "phaser";
import { base } from "$app/paths";

/**
 * 控制按鈕 UI（分享 & 重新輸入）
 */
export class ControlButtons {
    private scene: Scene;
    private shareButton: Phaser.GameObjects.DOMElement;
    private pastTopicsButton: Phaser.GameObjects.DOMElement;
    private retryButton: Phaser.GameObjects.DOMElement;
    private currentTopic: string = "";
    private onRetryCallback?: () => void;
    private onPastTopicsCallback?: () => void;
    private inputVisible: boolean = false;

    constructor(scene: Scene) {
        this.scene = scene;

        // 建立分享按鈕（右上角）
        this.shareButton = this.createButton(
            "分享議題",
            scene.scale.width - 16,
            16,
            () => {
                this.handleShare();
            },
            true
        );

        // 建立過去議題按鈕（左上角，永遠顯示）
        this.pastTopicsButton = this.createButton(
            "過去議題",
            16,
            16,
            () => {
                if (this.onPastTopicsCallback) {
                    this.onPastTopicsCallback();
                }
            },
            false
        );

        // 建立重新討論按鈕（左上角，永遠顯示）
        this.retryButton = this.createButton(
            "重新討論",
            140,
            16,
            () => {
                this.toggleInput();
            },
            false
        );

        // 監聽視窗大小改變
        this.scene.scale.on("resize", this.handleResize, this);
    }

    /**
     * 建立按鈕
     */
    private createButton(
        text: string,
        x: number,
        y: number,
        onClick: () => void,
        rightAlign: boolean = false
    ): Phaser.GameObjects.DOMElement {
        const isPast = text.includes("過去");
        const isShare = text.includes("分享");
        const icon = isShare ? "📤" : isPast ? "📜" : "🔄";
        const bgColor = isShare ? "#2196F3" : isPast ? "#FF9800" : "#4CAF50";
        const hoverColor = isShare ? "#1976D2" : isPast ? "#F57C00" : "#45a049";

        const buttonHtml = `
            <button style="
                padding: 10px 20px;
                font-size: 14px;
                font-weight: bold;
                background: linear-gradient(135deg, ${bgColor} 0%, ${hoverColor} 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Arial', sans-serif;
                transition: all 0.3s ease;
                white-space: nowrap;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 6px;
                letter-spacing: 0.5px;
            ">${icon} ${text}</button>
            <style>
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                }
                button:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
            </style>
        `;

        const button = this.scene.add
            .dom(x, y, "div")
            .createFromHTML(buttonHtml)
            .setOrigin(rightAlign ? 1 : 0, 0)
            .setDepth(9998)
            .setScrollFactor(0);

        const btnElement = button.node.querySelector(
            "button"
        ) as HTMLButtonElement;

        if (btnElement) {
            btnElement.addEventListener("click", onClick);
        }

        return button;
    }

    /**
     * 處理視窗大小改變
     */
    private handleResize(gameSize: Phaser.Structs.Size): void {
        // 更新分享按鈕位置（右上角）
        this.shareButton.setPosition(gameSize.width - 16, 16);
        // 左上角按鈕保持固定位置
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
            console.error("複製失敗:", error);
            // Fallback: 使用 prompt 顯示網址
            prompt("請手動複製此網址：", shareUrl);
        }
    }

    /**
     * 建立分享網址
     */
    private buildShareUrl(): string {
        const baseUrl = window.location.origin;
        const basePath = base || "";

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
        const btnElement = this.shareButton.node.querySelector(
            "button"
        ) as HTMLButtonElement;
        if (!btnElement) return;

        const originalText = btnElement.textContent;
        const originalColor = btnElement.style.backgroundColor;

        btnElement.textContent = "✓ 已複製！";
        btnElement.style.backgroundColor = "#4CAF50";

        this.scene.time.delayedCall(1500, () => {
            btnElement.textContent = originalText || "📤 分享議題";
            btnElement.style.backgroundColor = originalColor || "#2196F3";
        });
    }

    /**
     * 切換輸入框顯示/隱藏
     */
    private toggleInput(): void {
        // 觸發切換的回調
        if (this.onRetryCallback) {
            this.onRetryCallback();
        }

        // 切換狀態
        this.inputVisible = !this.inputVisible;

        // 更新按鈕文字
        const btnElement = this.retryButton.node.querySelector(
            "button"
        ) as HTMLButtonElement;

        if (btnElement) {
            if (this.inputVisible) {
                btnElement.innerHTML = "⬆️ 收起";
            } else {
                btnElement.innerHTML = "🔄 重新討論";
            }
        }
    }

    /**
     * 設定當前主題
     */
    setCurrentTopic(topic: string): void {
        this.currentTopic = topic;
    }

    /**
     * 設定重新輸入回調（用於切換輸入框顯示/隱藏）
     */
    onRetry(callback: () => void): void {
        this.onRetryCallback = callback;
    }

    /**
     * 設定過去議題回調
     */
    onPastTopics(callback: () => void): void {
        this.onPastTopicsCallback = callback;
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.scene.scale.off("resize", this.handleResize, this);
        this.shareButton.destroy();
        this.retryButton.destroy();
        this.pastTopicsButton.destroy();
    }
}
