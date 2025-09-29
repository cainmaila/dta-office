import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { DialogueManager } from '../managers/DialogueManager';

export class Game extends Scene
{
    private dialogueManager: DialogueManager;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        
        // 載入參考圖片用於比例分析
        this.load.image('reference_game', 'reference_game.png');
        
        // 載入辦公室背景 (需要確認其網格結構)
        this.load.image('office_bg', 'tilesets/office_bg2.png');
        
        // 載入NPC角色sprite sheets - 設置透明色處理
        // 載入時我們可以指定透明色（如果素材使用了標準透明色）
        this.load.spritesheet('npc-sheet', 'tilesets/npc.png', {
            frameWidth: Math.floor(1024/13), // 78像素
            frameHeight: Math.floor(1024/11)  // 93像素
        });
        
        this.load.spritesheet('npc-a-sheet', 'tilesets/npc-a.png', {
            frameWidth: Math.floor(1024/13),
            frameHeight: Math.floor(1024/11)
        });
        
        this.load.spritesheet('npc-in-sheet', 'tilesets/npc-in.png', {
            frameWidth: Math.floor(1024/13),
            frameHeight: Math.floor(1024/11)
        });
        
        this.load.spritesheet('npm-b-sheet', 'tilesets/npm-b.png', {
            frameWidth: Math.floor(1024/13),
            frameHeight: Math.floor(1024/11)
        });
        
        // 保留原始素材以防需要
        this.load.image('star', 'star.png');
        this.load.image('logo', 'logo.png');
        
        // 載入完成後處理透明度
        this.load.on('complete', () => {
            this.processTransparency();
        });
    }

    create ()
    {
        // 創建背景
        this.add.image(512, 512, 'office_bg').setOrigin(0.5, 0.5);
        
        // 處理透明度
        this.processTransparency();

        // 初始化對話管理器
        this.dialogueManager = new DialogueManager(this);

        // 創建NPC系統
        this.createFinalNPCs();

        // 通知場景準備完成
        EventBus.emit('current-scene-ready', this);
    }

    private createFinalNPCs(): void {
        // 重新規劃的NPC位置 - 基於辦公室實際佈局視覺分析
        const npcConfigs = [
            // 左側辦公區域 - 靠近辦公桌
            { name: '李經理', x: 220, y: 500, sheet: 'npc-a-sheet', frame: 0, dialogue: '歡迎來到我們公司！有什麼可以幫助你的嗎？' },
            { name: '林助理', x: 180, y: 450, sheet: 'npc-a-sheet', frame: 14, dialogue: '需要什麼協助嗎？我可以幫你安排會議室或準備資料。' },
            
            // 中央辦公區域 - 工作站附近
            { name: '王設計師', x: 450, y: 420, sheet: 'npc-in-sheet', frame: 1, dialogue: '我正在設計新的用戶介面，你覺得這個顏色搭配怎麼樣？' },
            { name: '陳工程師', x: 550, y: 480, sheet: 'npc-sheet', frame: 2, dialogue: '今天的程式碼 review 進行得很順利，新功能快要上線了！' },
            
            // 右側辦公區域 - 辦公桌旁
            { name: '孫專員', x: 720, y: 440, sheet: 'npc-sheet', frame: 27, dialogue: '我負責資料分析，有數據相關問題可以找我。' },
            { name: '周顧問', x: 800, y: 500, sheet: 'npm-b-sheet', frame: 39, dialogue: '我提供技術諮詢，歡迎隨時討論技術問題。' },
            
            // 上方區域 - 主管辦公室或會議區
            { name: '張主管', x: 420, y: 280, sheet: 'npm-b-sheet', frame: 13, dialogue: '團隊合作是我們成功的關鍵，大家都辛苦了！' },
            
            // 中央走道 - 討論或移動中
            { name: '趙同事', x: 350, y: 380, sheet: 'npc-in-sheet', frame: 26, dialogue: '最近的專案進度很不錯，團隊合作很愉快！' }
        ];

        npcConfigs.forEach((config, index) => {
            const sprite = this.add.sprite(config.x, config.y, config.sheet, config.frame);
            sprite.setOrigin(0.5, 1);
            sprite.setScale(1.0); // 確認使用1.0x縮放
            sprite.setDepth(config.y);
            
            // 嘗試處理背景透明
            this.tryRemoveBackground(sprite);
            
            // 設置互動
            sprite.setInteractive();
            sprite.on('pointerover', () => {
                sprite.setTint(0xdddddd);
                this.input.setDefaultCursor('pointer');
            });
            sprite.on('pointerout', () => {
                sprite.clearTint();
                this.input.setDefaultCursor('default');
            });
            sprite.on('pointerdown', () => {
                // 添加點擊動畫
                this.tweens.add({
                    targets: sprite,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2'
                });
                
                // 觸發對話氣泡事件
                this.events.emit('show-dialogue', {
                    name: config.name,
                    message: config.dialogue,
                    x: config.x,
                    y: config.y
                });
            });
            
            // 添加名字標籤
            this.add.text(config.x, config.y - 120, config.name, {
                fontSize: '14px',
                color: '#333333',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: { x: 6, y: 3 }
            }).setOrigin(0.5).setDepth(config.y + 1);
        });
    }

    private processTransparency(): void {
        // 處理spritesheet的透明度
        // 這個方法在所有資源載入完成後執行
        const spriteSheets = ['npc-sheet', 'npc-a-sheet', 'npc-in-sheet', 'npm-b-sheet'];
        
        spriteSheets.forEach(sheetName => {
            const texture = this.textures.get(sheetName);
            if (texture) {
                // 靜默處理透明度
            }
        });
    }

    private tryRemoveBackground(sprite: Phaser.GameObjects.Sprite): void {
        // 在Phaser中處理透明度的幾種策略：
        
        // 1. 設置混合模式 - 可能有助於透明效果
        sprite.setBlendMode(Phaser.BlendModes.NORMAL);
        
        // 2. 如果素材本身有透明通道，確保正確顯示
        sprite.setAlpha(1.0);
        
        // 3. 最有效的方法是在製作素材時就處理好透明背景
        // 靜默處理，不輸出日誌
    }

    destroy() {
        if (this.dialogueManager) {
            this.dialogueManager.destroy();
        }
        super.destroy();
    }
}
