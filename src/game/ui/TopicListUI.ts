import { Scene } from "phaser";
import type { TopicItem } from "../../lib/api/teamDialogue";

/**
 * 議題列表 UI - 顯示過去的議題（0-10 筆）
 */
export class TopicListUI {
    private scene: Scene;
    private domElement: Phaser.GameObjects.DOMElement;
    private topics: TopicItem[] = [];
    private onTopicSelectCallback?: (topic: string) => void;
    private lastVisibility: boolean = false;

    constructor(scene: Scene) {
        this.scene = scene;

        // 建立 DOM 元素
        // 位置會在 show() 時動態計算
        this.domElement = scene.add
            .dom(0, 0)
            .createFromHTML("<div></div>")
            .setOrigin(0, 0) // 左上角對齐
            .setDepth(9997)
            .setScrollFactor(0)
            .setVisible(false); // 初始為隱藏

        // 監聽視窗大小改變
        scene.scale.on("resize", this.handleResize, this);
    }

    /**
     * 更新議題列表
     */
    updateTopics(topics: TopicItem[]): void {
        this.topics = topics.slice(0, 10); // 最多顯示 10 筆
        this.renderList();
    }

    /**
     * 渲染列表
     */
    private renderList(): void {
        if (this.topics.length === 0) {
            this.domElement.setHTML(
                `<div class="topic-list-container" style="
                    background: linear-gradient(135deg, rgba(26, 26, 26, 0.92) 0%, rgba(13, 13, 13, 0.92) 100%);
                    padding: 24px;
                    border-radius: 16px;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 165, 0, 0.25);
                    backdrop-filter: blur(16px);
                    min-width: 320px;
                    border: 1px solid rgba(255, 165, 0, 0.15);
                ">
                    <div style="
                        color: #999;
                        text-align: center;
                        padding: 16px;
                        font-size: 14px;
                        font-family: 'Arial', sans-serif;
                    ">📭 無過去議題</div>
                </div>`
            );
            return;
        }

        // 建立列表項目
        const itemsHTML = this.topics
            .map(
                (topic, index) => `
            <button class="topic-item" data-index="${index}">
                <div class="topic-icon">📌</div>
                <div class="topic-content">
                    <div class="topic-title">${this.escapeHtml(topic.topic)}</div>
                    <div class="topic-time">${this.formatDate(topic.timestamp)}</div>
                </div>
                <div class="topic-arrow">→</div>
            </button>
        `
            )
            .join("");

        const containerHTML = `
            <div class="topic-list-container">
                <div class="topic-list-header">
                    <span class="header-icon">📜</span>
                    <span class="header-text">過去議題</span>
                    <span class="header-count">${this.topics.length}</span>
                </div>
                <div class="topic-list-items">
                    ${itemsHTML}
                </div>
                <style>
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes slideInRight {
                        from {
                            opacity: 0;
                            transform: translateX(-8px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }

                    .topic-list-container {
                        background: linear-gradient(135deg, rgba(26, 26, 26, 0.92) 0%, rgba(13, 13, 13, 0.92) 100%);
                        padding: 0;
                        border-radius: 16px;
                        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7),
                                    0 0 0 1px rgba(255, 165, 0, 0.25),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                        min-width: 360px;
                        max-width: 420px;
                        border: 1px solid rgba(255, 165, 0, 0.15);
                        overflow: hidden;
                        animation: fadeInUp 0.3s ease-out;
                    }

                    .topic-list-header {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 16px 20px;
                        background: linear-gradient(135deg, rgba(255, 165, 0, 0.12) 0%, rgba(255, 165, 0, 0.06) 100%);
                        border-bottom: 1px solid rgba(255, 165, 0, 0.2);
                    }

                    .header-icon {
                        font-size: 18px;
                    }

                    .header-text {
                        flex: 1;
                        color: #FF9800;
                        font-size: 15px;
                        font-weight: bold;
                        font-family: 'Arial', sans-serif;
                        letter-spacing: 0.5px;
                    }

                    .header-count {
                        background: rgba(255, 165, 0, 0.2);
                        color: #FFB74D;
                        font-size: 12px;
                        font-weight: bold;
                        padding: 3px 10px;
                        border-radius: 12px;
                        border: 1px solid rgba(255, 165, 0, 0.3);
                    }

                    .topic-list-items {
                        max-height: 400px;
                        overflow-y: auto;
                        padding: 12px;
                    }

                    .topic-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        width: 100%;
                        padding: 14px 16px;
                        text-align: left;
                        background: rgba(255, 255, 255, 0.02);
                        border: 1px solid rgba(255, 165, 0, 0.15);
                        border-radius: 10px;
                        color: #fff;
                        cursor: pointer;
                        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                        margin-bottom: 8px;
                        font-family: 'Arial', sans-serif;
                        position: relative;
                        overflow: hidden;
                        animation: slideInRight 0.3s ease-out backwards;
                    }

                    .topic-item:nth-child(1) { animation-delay: 0.05s; }
                    .topic-item:nth-child(2) { animation-delay: 0.1s; }
                    .topic-item:nth-child(3) { animation-delay: 0.15s; }
                    .topic-item:nth-child(4) { animation-delay: 0.2s; }
                    .topic-item:nth-child(5) { animation-delay: 0.25s; }

                    .topic-item::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, rgba(255, 165, 0, 0.08) 0%, rgba(255, 165, 0, 0.03) 100%);
                        opacity: 0;
                        transition: opacity 0.25s ease;
                    }

                    .topic-item:hover {
                        background: rgba(255, 165, 0, 0.08);
                        border-color: rgba(255, 165, 0, 0.4);
                        transform: translateX(6px) scale(1.01);
                        box-shadow: 0 4px 16px rgba(255, 165, 0, 0.2),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    }

                    .topic-item:hover::before {
                        opacity: 1;
                    }

                    .topic-item:active {
                        transform: translateX(4px) scale(0.99);
                        background: rgba(255, 165, 0, 0.12);
                    }

                    .topic-icon {
                        font-size: 20px;
                        flex-shrink: 0;
                        transition: transform 0.25s ease;
                    }

                    .topic-item:hover .topic-icon {
                        transform: scale(1.15) rotate(-5deg);
                    }

                    .topic-content {
                        flex: 1;
                        min-width: 0;
                    }

                    .topic-title {
                        font-size: 14px;
                        font-weight: 500;
                        color: #fff;
                        margin-bottom: 4px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    }

                    .topic-time {
                        font-size: 11px;
                        color: #999;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .topic-time::before {
                        content: '🕐';
                        font-size: 10px;
                    }

                    .topic-arrow {
                        font-size: 16px;
                        color: rgba(255, 165, 0, 0.4);
                        flex-shrink: 0;
                        transition: all 0.25s ease;
                    }

                    .topic-item:hover .topic-arrow {
                        color: #FF9800;
                        transform: translateX(4px);
                    }

                    .topic-list-items::-webkit-scrollbar {
                        width: 8px;
                    }

                    .topic-list-items::-webkit-scrollbar-track {
                        background: rgba(255, 165, 0, 0.05);
                        border-radius: 4px;
                        margin: 8px 0;
                    }

                    .topic-list-items::-webkit-scrollbar-thumb {
                        background: linear-gradient(180deg, rgba(255, 165, 0, 0.4) 0%, rgba(255, 165, 0, 0.25) 100%);
                        border-radius: 4px;
                        border: 2px solid rgba(26, 26, 26, 0.5);
                    }

                    .topic-list-items::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(180deg, rgba(255, 165, 0, 0.6) 0%, rgba(255, 165, 0, 0.4) 100%);
                    }
                </style>
            </div>
        `;

        this.domElement.setHTML(containerHTML);

        // 綁定按鈕事件
        const buttons = this.domElement.node.querySelectorAll(
            ".topic-item"
        ) as NodeListOf<HTMLButtonElement>;
        buttons.forEach((button) => {
            button.addEventListener("click", (e) => {
                const index = parseInt(button.dataset.index || "0");
                const topic = this.topics[index];
                if (topic && this.onTopicSelectCallback) {
                    this.onTopicSelectCallback(topic.topic);
                }
            });
        });
    }

    /**
     * 格式化日期
     */
    private formatDate(timestamp: number): string {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} 天前`;
        } else if (hours > 0) {
            return `${hours} 小時前`;
        } else if (minutes > 0) {
            return `${minutes} 分鐘前`;
        } else {
            return "剛剛";
        }
    }

    /**
     * 轉義 HTML
     */
    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * 設定議題選擇回調
     */
    onTopicSelect(callback: (topic: string) => void): void {
        this.onTopicSelectCallback = callback;
    }

    /**
     * 顯示
     */
    show(): void {
        // 動態計算位置：與按鈕列對齐（左邊 16px）
        const x = 16;
        const y = 60; // 按鈕下方
        this.domElement.setPosition(x, y);
        this.domElement.setVisible(true);
        this.lastVisibility = true;
    }

    /**
     * 隱藏
     */
    hide(): void {
        this.domElement.setVisible(false);
        this.lastVisibility = false;
    }

    /**
     * 切換顯示/隱藏
     */
    toggle(): void {
        if (this.domElement.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 檢查是否可見
     */
    isVisible(): boolean {
        return this.domElement.visible;
    }

    /**
     * 處理視窗大小改變
     */
    private handleResize(gameSize: Phaser.Structs.Size): void {
        // 如果正在顯示，保持位置對齐
        if (this.lastVisibility) {
            this.domElement.setPosition(16, 60);
        }
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.scene.scale.off("resize", this.handleResize, this);
        this.domElement.destroy();
    }
}
