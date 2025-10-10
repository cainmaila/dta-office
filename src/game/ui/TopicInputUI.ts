import { Scene } from 'phaser';

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
                gap: 12px;
                background-color: rgba(0, 0, 0, 0.85);
                padding: 24px 32px;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
            ">
                <h2 style="
                    color: #ffffff;
                    font-size: 20px;
                    margin: 0 0 8px 0;
                    font-family: Arial, sans-serif;
                ">靠背DTA</h2>

                <input
                    id="topic-input"
                    type="text"
                    placeholder="DTA今日事項?"
                    style="
                        width: 340px;
                        padding: 12px 16px;
                        font-size: 16px;
                        border: 2px solid #666;
                        border-radius: 4px;
                        background-color: #fff;
                        color: #333;
                        outline: none;
                        font-family: Arial, sans-serif;
                    "
                />

                <button
                    id="topic-submit"
                    style="
                        padding: 10px 32px;
                        font-size: 16px;
                        background-color: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: Arial, sans-serif;
                        transition: background-color 0.2s;
                    "
                >開始討論</button>
            </div>
        `;

        // 建立 DOM 元素並置中下方
        const x = scene.scale.width / 2;
        const y = scene.scale.height - 120;

        this.domElement = scene.add.dom(x, y)
            .createFromHTML(htmlContent)
            .setOrigin(0.5)
            .setDepth(9999)
            .setScrollFactor(0);

        // 綁定事件
        this.setupEvents();

        // 監聽視窗大小改變
        scene.scale.on('resize', this.handleResize, this);
    }

    /**
     * 設定事件監聽
     */
    private setupEvents(): void {
        const button = this.domElement.getChildByID('topic-submit') as HTMLButtonElement;
        const input = this.domElement.getChildByID('topic-input') as HTMLInputElement;

        if (!button || !input) {
            console.error('TopicInputUI: 找不到 input 或 button 元素');
            return;
        }

        // 按鈕點擊
        button.addEventListener('click', () => {
            this.handleSubmit(input.value.trim());
        });

        // Enter 鍵送出
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.handleSubmit(input.value.trim());
            }
        });

        // Hover 效果
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#45a049';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#4CAF50';
        });
    }

    /**
     * 處理送出
     */
    private handleSubmit(topic: string): void {
        if (!topic) {
            alert('請輸入主題');
            return;
        }

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
        const input = this.domElement.getChildByID('topic-input') as HTMLInputElement;
        if (input) {
            input.value = '';
        }
    }

    /**
     * 顯示
     */
    show(): void {
        this.domElement.setVisible(true);

        // 自動 focus
        this.scene.time.delayedCall(100, () => {
            const input = this.domElement.getChildByID('topic-input') as HTMLInputElement;
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
        this.domElement.setPosition(
            gameSize.width / 2,
            gameSize.height - 120
        );
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.scene.scale.off('resize', this.handleResize, this);
        this.domElement.destroy();
    }
}
