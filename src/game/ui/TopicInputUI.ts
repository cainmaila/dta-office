import { Scene } from "phaser";
import { SoundManager } from "../utils/SoundManager";

/**
 * 主題輸入框 UI (Phaser DOM 元素)
 */
export class TopicInputUI {
    private scene: Scene;
    private domElement: Phaser.GameObjects.DOMElement;
    private onSubmitCallback?: (topic: string) => void;

    constructor(scene: Scene) {
        this.scene = scene;

        // 建立 HTML 結構
        const htmlContent = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(13, 13, 13, 0.95) 100%);
                padding: 32px 40px;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(76, 175, 80, 0.3);
                backdrop-filter: blur(10px);
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                ">
                    <div style="
                        width: 8px;
                        height: 8px;
                        background-color: #4CAF50;
                        border-radius: 50%;
                        box-shadow: 0 0 10px rgba(76, 175, 80, 0.8);
                        animation: pulse 2s infinite;
                    "></div>
                    <h2 style="
                        color: #ffffff;
                        font-size: 24px;
                        margin: 0;
                        font-family: 'Arial', sans-serif;
                        font-weight: bold;
                        letter-spacing: 1px;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                    ">靠背 DTA</h2>
                </div>

                <input
                    id="topic-input"
                    type="text"
                    placeholder="今天要討論什麼？"
                    style="
                        width: 380px;
                        padding: 14px 18px;
                        font-size: 16px;
                        border: 2px solid rgba(76, 175, 80, 0.3);
                        border-radius: 8px;
                        background-color: rgba(255, 255, 255, 0.95);
                        color: #333;
                        outline: none;
                        font-family: 'Arial', sans-serif;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    "
                />

                <button
                    id="topic-submit"
                    style="
                        padding: 12px 40px;
                        font-size: 16px;
                        font-weight: bold;
                        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: 'Arial', sans-serif;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
                        letter-spacing: 0.5px;
                    "
                >🚀 開始討論</button>

                <style>
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(0.9); }
                    }
                    #topic-input:focus {
                        border-color: #4CAF50;
                        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3);
                    }
                    #topic-submit:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
                        background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
                    }
                    #topic-submit:active {
                        transform: translateY(0);
                        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
                    }
                </style>
            </div>
        `;

        // 建立 DOM 元素並置中下方
        const x = scene.scale.width / 2;
        const y = scene.scale.height - 120;

        this.domElement = scene.add
            .dom(x, y)
            .createFromHTML(htmlContent)
            .setOrigin(0.5)
            .setDepth(9999)
            .setScrollFactor(0)
            .setVisible(false); // 初始為隱藏

        // 綁定事件
        this.setupEvents();

        // 監聽視窗大小改變
        scene.scale.on("resize", this.handleResize, this);
    }

    /**
     * 設定事件監聽
     */
    private setupEvents(): void {
        const button = this.domElement.getChildByID(
            "topic-submit"
        ) as HTMLButtonElement;
        const input = this.domElement.getChildByID(
            "topic-input"
        ) as HTMLInputElement;

        if (!button || !input) {
            console.error("TopicInputUI: 找不到 input 或 button 元素");
            return;
        }

        // 按鈕點擊
        button.addEventListener("click", () => {
            this.handleSubmit(input.value.trim());
        });

        // Enter 鍵送出
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                this.handleSubmit(input.value.trim());
            }
        });

        // Hover 效果
        button.addEventListener("mouseenter", () => {
            button.style.backgroundColor = "#45a049";
        });

        button.addEventListener("mouseleave", () => {
            button.style.backgroundColor = "#4CAF50";
        });
    }

    /**
     * 處理送出
     */
    private handleSubmit(topic: string): void {
        if (!topic) {
            alert("請輸入主題");
            return;
        }

        // 播放送出音效
        SoundManager.playSound("/sound/timer-start.mp3", 0.5);

        if (this.onSubmitCallback) {
            this.onSubmitCallback(topic);
        }
    }

    /**
     * 設定送出回調
     */
    onSubmit(callback: (topic: string) => void): void {
        this.onSubmitCallback = callback;
    }

    /**
     * 清空輸入框
     */
    clearInput(): void {
        const input = this.domElement.getChildByID(
            "topic-input"
        ) as HTMLInputElement;
        if (input) {
            input.value = "";
        }
    }

    /**
     * 顯示
     */
    show(): void {
        this.domElement.setVisible(true);

        // 自動 focus
        this.scene.time.delayedCall(100, () => {
            const input = this.domElement.getChildByID(
                "topic-input"
            ) as HTMLInputElement;
            input?.focus();
        });
    }

    /**
     * 隱藏
     */
    hide(): void {
        this.domElement.setVisible(false);
        this.clearInput();
    }

    /**
     * 處理視窗大小改變
     */
    private handleResize(gameSize: Phaser.Structs.Size): void {
        this.domElement.setPosition(gameSize.width / 2, gameSize.height - 120);
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.scene.scale.off("resize", this.handleResize, this);
        this.domElement.destroy();
    }
}
