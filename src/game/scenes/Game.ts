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
        
        // 載入辦公室背景
        this.load.image('office_bg', 'tilesets/office_bg2.png');
        
        // 載入NPC Atlas - 使用新的atlas系統
        this.load.atlas('npc-atlas', 'tilesets/npc.png', 'data/npc_atlas.json');
        
        // 保留原始素材以防需要 (作為備用)
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
        
        // 載入其他資源
        this.load.image('star', 'star.png');
        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        // 創建背景
        this.add.image(512, 512, 'office_bg').setOrigin(0.5, 0.5);

        // 初始化對話管理器
        this.dialogueManager = new DialogueManager(this);

        // 暫時使用簡單的fallback系統
        this.createFallbackNPCs();

        // 通知場景準備完成
        EventBus.emit('current-scene-ready', this);
    }

    private createFallbackNPCs(): void {
        console.log('🔄 Creating NPCs with corrected floor positions');
        
        // 重新規劃NPC位置 - 確保都站在地板上
        const npcConfigs = [
            // 李經理 - 左側辦公區域，站在地板上
            { name: '李經理', x: 200, y: 750, sheet: 'npc-sheet', frame: 0, dialogue: '歡迎來到我們公司！有什麼可以幫助你的嗎？' },
            
            // 王設計師 - 中左區域，辦公桌附近
            { name: '王設計師', x: 350, y: 680, sheet: 'npc-sheet', frame: 1, dialogue: '我正在設計新的用戶介面，你覺得這個顏色搭配怎麼樣？' },
            
            // 陳工程師 - 中右區域，工作站附近
            { name: '陳工程師', x: 550, y: 720, sheet: 'npc-sheet', frame: 2, dialogue: '今天的程式碼 review 進行得很順利，新功能快要上線了！' },
            
            // 張主管 - 右側區域，靠近辦公桌
            { name: '張主管', x: 750, y: 650, sheet: 'npc-sheet', frame: 3, dialogue: '團隊合作是我們成功的關鍵，大家都辛苦了！' }
        ];

        npcConfigs.forEach((config) => {
            const sprite = this.add.sprite(config.x, config.y, config.sheet, config.frame);
            sprite.setOrigin(0.5, 1); // 底部中心為錨點，確保角色腳部在指定座標
            sprite.setScale(1.0);
            sprite.setDepth(config.y);
            
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
                this.tweens.add({
                    targets: sprite,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2'
                });
                
                this.events.emit('show-dialogue', {
                    name: config.name,
                    message: config.dialogue,
                    x: config.x,
                    y: config.y
                });
            });
            
            // 添加名字標籤
            const nameText = this.add.text(config.x, config.y - 100, config.name, {
                fontSize: '14px',
                color: '#333333',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: { x: 6, y: 3 }
            });
            nameText.setOrigin(0.5).setDepth(config.y + 1);
        });

        console.log('✅ All NPCs correctly positioned on office floor areas');
    }

    destroy() {
        if (this.dialogueManager) {
            this.dialogueManager.destroy();
        }
        super.destroy();
    }
}
