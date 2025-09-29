import { Scene } from 'phaser';
import { DialogueBubble } from '../objects/DialogueBubble';

export class DialogueManager {
    private scene: Scene;
    private currentBubble: DialogueBubble | null = null;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        // 監聽NPC的對話事件
        this.scene.events.on('show-dialogue', (data: {
            name: string;
            message: string;
            x: number;
            y: number;
        }) => {
            this.showDialogue(data.name, data.message, data.x, data.y);
        });
    }
    
    public showDialogue(name: string, message: string, npcX: number, npcY: number): void {
        // 如果已有對話氣泡，先移除
        this.hideCurrentBubble();
        
        // 計算氣泡位置 - 在NPC頭頂上方
        const bubbleX = npcX;
        const bubbleY = npcY - 150; // 在NPC上方150像素
        
        // 確保氣泡不超出螢幕邊界
        const adjustedX = Math.max(120, Math.min(bubbleX, 904)); // 120到904像素範圍
        const adjustedY = Math.max(80, bubbleY); // 至少在螢幕上方80像素
        
        // 檢查場景是否有效 - 修正API調用
        if (!this.scene || this.scene.sys.isDestroyed) {
            return;
        }
        
        // 創建新的對話氣泡
        this.currentBubble = new DialogueBubble(
            this.scene,
            adjustedX,
            adjustedY,
            message,
            npcX,
            npcY
        );
        
        // 顯示氣泡
        this.currentBubble.show(4000); // 4秒後自動消失
    }
    
    private hideCurrentBubble(): void {
        if (this.currentBubble && !this.currentBubble.destroyed) {
            this.currentBubble.hide();
            this.currentBubble = null;
        }
    }
    
    public destroy(): void {
        this.hideCurrentBubble();
        this.scene.events.off('show-dialogue');
    }
}