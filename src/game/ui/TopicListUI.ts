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
                `<div style="
                    color: #999;
                    text-align: center;
                    padding: 16px;
                    font-size: 14px;
                ">無過去議題</div>`
            );
            return;
        }

        // 建立列表項目
        const itemsHTML = this.topics
            .map(
                (topic, index) => `
            <button class="topic-item" data-index="${index}" style="
                display: block;
                width: 100%;
                padding: 12px 16px;
                text-align: left;
                background: transparent;
                border: 1px solid rgba(255, 165, 0, 0.3);
                border-radius: 4px;
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 8px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-family: 'Arial', sans-serif;
            ">
                <span style="color: #FF9800;">📌</span> ${this.escapeHtml(
                    topic.topic
                )}
                <span style="
                    display: block;
                    font-size: 12px;
                    color: #999;
                    margin-top: 4px;
                ">${this.formatDate(topic.timestamp)}</span>
            </button>
        `
            )
            .join("");

        const containerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(13, 13, 13, 0.95) 100%);
                padding: 16px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 165, 0, 0.2);
                backdrop-filter: blur(10px);
                max-width: 400px;
                max-height: 320px;
                overflow-y: auto;
                border: 1px solid rgba(255, 165, 0, 0.2);
            ">
                ${itemsHTML}
                <style>
                    .topic-item:hover {
                        background: rgba(255, 165, 0, 0.1);
                        border-color: rgba(255, 165, 0, 0.6);
                        transform: translateX(4px);
                    }
                    .topic-item:active {
                        background: rgba(255, 165, 0, 0.2);
                    }
                    div::-webkit-scrollbar {
                        width: 6px;
                    }
                    div::-webkit-scrollbar-track {
                        background: rgba(255, 165, 0, 0.1);
                        border-radius: 3px;
                    }
                    div::-webkit-scrollbar-thumb {
                        background: rgba(255, 165, 0, 0.3);
                        border-radius: 3px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 165, 0, 0.5);
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
