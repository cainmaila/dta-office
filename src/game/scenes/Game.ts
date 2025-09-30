import Phaser, { Scene, Scenes } from "phaser";
import { EventBus } from "../EventBus";
import { DialogueManager } from "../managers/DialogueManager";
import { roundTableNpcs } from "../data/roundTableNpcs";
import type { HotspotNPC } from "../types/NPCTypes";

export class Game extends Scene {
    private dialogueManager!: DialogueManager;
    private hotspotDebugEnabled = false;
    private hotspotDebugText?: Phaser.GameObjects.Text;
    private roundTableHotspots: Array<{
        zone: Phaser.GameObjects.Zone;
        npc: HotspotNPC;
        debugVisual: Phaser.GameObjects.Graphics;
        debugLabel: Phaser.GameObjects.Text;
    }> = [];

    constructor() {
        super("Game");
    }

    preload() {
        this.load.setPath("assets");

        // 載入參考圖片用於比例分析
        this.load.image("reference_game", "reference_game.png");

        // 載入辦公室背景
        this.load.image("office_bg", "bg6.png");

        // 載入NPC Atlas - 使用新的atlas系統
        this.load.atlas("npc-atlas", "tilesets/npc.png", "data/npc_atlas.json");

        // 保留原始素材以防需要 (作為備用)
        this.load.spritesheet("npc-sheet", "tilesets/npc.png", {
            frameWidth: Math.floor(1024 / 13), // 78像素
            frameHeight: Math.floor(1024 / 11), // 93像素
        });

        this.load.spritesheet("npc-a-sheet", "tilesets/npc-a.png", {
            frameWidth: Math.floor(1024 / 13),
            frameHeight: Math.floor(1024 / 11),
        });

        this.load.spritesheet("npc-in-sheet", "tilesets/npc-in.png", {
            frameWidth: Math.floor(1024 / 13),
            frameHeight: Math.floor(1024 / 11),
        });

        this.load.spritesheet("npm-b-sheet", "tilesets/npm-b.png", {
            frameWidth: Math.floor(1024 / 13),
            frameHeight: Math.floor(1024 / 11),
        });

        // 載入其他資源
        this.load.image("star", "star.png");
        this.load.image("logo", "logo.png");
    }

    create() {
        // 創建背景
        this.add.image(512, 512, "office_bg").setOrigin(0.5, 0.5);

        // 初始化對話管理器
        this.dialogueManager = new DialogueManager(this);

        this.events.once(Scenes.Events.SHUTDOWN, () => {
            this.dialogueManager.destroy();
            this.roundTableHotspots.forEach(
                ({ zone, debugVisual, debugLabel }) => {
                    zone.destroy();
                    debugVisual.destroy();
                    debugLabel.destroy();
                }
            );
            this.roundTableHotspots = [];
        });

        // 建立圓桌 NPC 熱區
        this.createRoundTableHotspots();

        this.setupHotspotDebugger();

        // 通知場景準備完成
        EventBus.emit("current-scene-ready", this);
    }

    private createRoundTableHotspots(): void {
        this.roundTableHotspots = roundTableNpcs.map((npc) => {
            const zone = this.add
                .zone(npc.x, npc.y, npc.radius * 2, npc.radius * 2)
                .setOrigin(0.5, 0.5)
                .setDepth(1000);

            zone.setInteractive(
                new Phaser.Geom.Circle(0, 0, npc.radius),
                Phaser.Geom.Circle.Contains
            );

            const debugVisual = this.add.graphics();
            debugVisual.lineStyle(2, 0xffcc00, 0.9);
            debugVisual.fillStyle(0xffcc00, 0.15);
            debugVisual.fillCircle(0, 0, npc.radius);
            debugVisual.strokeCircle(0, 0, npc.radius);
            debugVisual.setPosition(npc.x, npc.y);
            debugVisual.setDepth(2499);
            debugVisual.setVisible(false);

            const debugLabel = this.add
                .text(npc.x, npc.y - npc.radius - 20, npc.name, {
                    fontSize: "14px",
                    color: "#ffcc00",
                    backgroundColor: "rgba(0, 0, 0, 0.65)",
                    padding: { x: 6, y: 4 },
                })
                .setOrigin(0.5)
                .setDepth(2500)
                .setVisible(false);

            zone.on("pointerover", () => {
                this.input.setDefaultCursor("pointer");
                if (this.hotspotDebugEnabled) {
                    debugVisual.setVisible(true);
                    debugLabel.setVisible(true);
                }
            });

            zone.on("pointerout", () => {
                this.input.setDefaultCursor("default");
                if (this.hotspotDebugEnabled) {
                    debugVisual.setVisible(true);
                    debugLabel.setVisible(true);
                } else {
                    debugVisual.setVisible(false);
                    debugLabel.setVisible(false);
                }
            });

            zone.on("pointerdown", () => {
                this.events.emit("show-dialogue", {
                    name: npc.name,
                    message: npc.dialogue,
                    x: npc.x,
                    y: npc.y,
                    bubbleOffsetX: npc.bubbleOffsetX,
                    bubbleOffsetY: npc.bubbleOffsetY,
                });
            });

            return { zone, npc, debugVisual, debugLabel };
        });
    }

    private setupHotspotDebugger(): void {
        // 建立顯示座標的文字物件（預設隱藏）
        this.hotspotDebugText = this.add
            .text(16, 16, "", {
                fontSize: "14px",
                color: "#ffcc00",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: { x: 6, y: 4 },
            })
            .setScrollFactor(0)
            .setDepth(3000)
            .setVisible(false);

        // 切換熱區偵測模式
        this.input.keyboard?.on("keydown-H", () => {
            this.hotspotDebugEnabled = !this.hotspotDebugEnabled;
            console.log(
                `📍 Hotspot debug ${
                    this.hotspotDebugEnabled ? "enabled" : "disabled"
                }`
            );
            this.hotspotDebugText?.setVisible(this.hotspotDebugEnabled);
            this.roundTableHotspots.forEach(
                ({ debugVisual, debugLabel, npc }) => {
                    debugVisual.setVisible(this.hotspotDebugEnabled);
                    debugLabel.setVisible(this.hotspotDebugEnabled);
                    if (this.hotspotDebugEnabled) {
                        debugVisual.setPosition(npc.x, npc.y);
                        debugLabel.setPosition(npc.x, npc.y - npc.radius - 20);
                    }
                }
            );
        });

        // 移動時更新螢幕顯示
        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (!this.hotspotDebugEnabled || !this.hotspotDebugText) {
                return;
            }

            const x = Math.round(pointer.worldX);
            const y = Math.round(pointer.worldY);
            this.hotspotDebugText.setText(`x: ${x}\ny: ${y}`);
        });

        // 點擊時輸出座標
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (!this.hotspotDebugEnabled) {
                return;
            }

            const x = Math.round(pointer.worldX);
            const y = Math.round(pointer.worldY);
            console.log(`🎯 Hotspot candidate -> x: ${x}, y: ${y}`);
        });
    }
}
