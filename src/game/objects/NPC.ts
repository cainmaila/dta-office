import { Scene } from 'phaser';
import { NPCData } from '../types/NPCTypes';

export class NPC extends Phaser.GameObjects.Sprite {
    public npcData: NPCData;
    private isInteractive: boolean = true;

    constructor(scene: Scene, npcData: NPCData) {
        // 使用sprite sheet作為備用，因為atlas可能有問題
        let textureKey = 'npc-sheet';
        let frameKey = 0;
        
        super(scene, npcData.x, npcData.y, textureKey, frameKey);
        
        this.npcData = npcData;
        
        // 添加到場景
        scene.add.existing(this);
        
        // 設置圖片屬性
        this.setOrigin(0.5, 1); // 底部中心為錨點
        this.setScale(1.0); // 使用原始大小
        this.setDepth(this.y); // 設置深度以實現正確的層級
        
        // 設置點擊區域
        this.setupInteraction();
        
        // 添加名字標籤
        this.createNameLabel();
    }
    
    private setupInteraction(): void {
        // 設置為可互動
        this.setInteractive();
        
        // 添加點擊效果
        this.on('pointerover', () => {
            if (this.isInteractive) {
                this.setTint(0xdddddd); // 滑鼠懸停效果
                this.scene.input.setDefaultCursor('pointer');
            }
        });
        
        this.on('pointerout', () => {
            this.clearTint(); // 清除懸停效果
            this.scene.input.setDefaultCursor('default');
        });
        
        this.on('pointerdown', () => {
            if (this.isInteractive) {
                this.showDialogue();
            }
        });
    }
    
    private createNameLabel(): void {
        // 在NPC頭頂顯示名字（小字體）
        const nameText = this.scene.add.text(
            this.x, 
            this.y - this.height * this.scaleY - 10, 
            this.npcData.name,
            {
                fontSize: '14px',
                color: '#333333',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: { x: 6, y: 3 }
            }
        );
        nameText.setOrigin(0.5);
        nameText.setDepth(this.depth + 1);
    }
    
    public showDialogue(): void {
        // 發送事件給對話管理器
        this.scene.events.emit('show-dialogue', {
            npc: this,
            name: this.npcData.name,
            message: this.npcData.dialogue,
            x: this.x,
            y: this.y - this.height * this.scaleY - 20
        });
        
        // 添加點擊反饋效果
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.1,
            scaleY: this.scaleY * 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    public setInteractive(interactive: boolean = true): this {
        this.isInteractive = interactive;
        return super.setInteractive(interactive);
    }
}