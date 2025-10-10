import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { DialogueManager } from "../managers/DialogueManager";
import { NPCManager } from "../managers/NPCManager";
import { TopicDialogueManager } from "../managers/TopicDialogueManager";
import type {
    CharactersData,
    Character,
    HotspotNPC,
    HotspotNpcConfig,
} from "../types/NPCTypes";
import { gameConfig } from "../config";
import type { DialogueCharacter } from "../../lib/api/teamDialogue";

/**
 * 遊戲場景
 * 核心功能：管理每個 NPC 的點擊次數，根據次數顯示對應的對話
 */
export class Game extends Scene {
    private dialogueManager!: DialogueManager;
    private npcManager!: NPCManager;
    private topicDialogueManager!: TopicDialogueManager;
    private characters: Map<string, Character> = new Map();
    private customCharacters: DialogueCharacter[] | null = null;
    private backgroundImage?: Phaser.GameObjects.Image;
    private backgroundScale = 1;
    private backgroundScaleX = 1;
    private backgroundScaleY = 1;
    private backgroundOffsetX = 0;
    private backgroundOffsetY = 0;
    private sourceBackgroundWidth = 1024;
    private sourceBackgroundHeight = 1024;
    private backgroundDisplayWidth = 0;
    private backgroundDisplayHeight = 0;
    private roundTableHotspots: Array<{
        zone: Phaser.GameObjects.Zone;
        npc: HotspotNPC;
        world: {
            x: number;
            y: number;
            radius: number;
            bubbleOffsetX?: number;
            bubbleOffsetY?: number;
            bubbleGap?: number;
        };
        debugVisual: Phaser.GameObjects.Graphics;
        debugLabel: Phaser.GameObjects.Text;
        nameLabel: Phaser.GameObjects.Text;
        isHovering: boolean;
        isDialogueActive: boolean;
    }> = [];
    private handleUpdateCharactersDialogue = (
        newCharacters: DialogueCharacter[]
    ): void => {
        this.updateCharactersDialogue(newCharacters);
    };

    constructor() {
        super("Game");
    }

    preload() {
        this.load.setPath(gameConfig.assets.basePath);

        // 載入辦公室背景
        this.load.image(
            gameConfig.assets.background.key,
            gameConfig.assets.background.file
        );

        // 載入 NPC sprite sheet
        this.load.spritesheet(
            gameConfig.assets.npcSpriteSheet.key,
            gameConfig.assets.npcSpriteSheet.file,
            {
                frameWidth: gameConfig.assets.npcSpriteSheet.frameWidth,
                frameHeight: gameConfig.assets.npcSpriteSheet.frameHeight,
            }
        );
    }

    create() {
        // 創建背景
        const background = this.add
            .image(0, 0, gameConfig.assets.background.key)
            .setOrigin(0.5, 0.5);
        const sourceImage = background.texture.getSourceImage() as
            | HTMLImageElement
            | HTMLCanvasElement;
        const naturalWidth = sourceImage?.width ?? background.width;
        const naturalHeight = sourceImage?.height ?? background.height;

        this.backgroundImage = background;
        this.sourceBackgroundWidth = naturalWidth;
        this.sourceBackgroundHeight = naturalHeight;

        this.configureBackgroundLayout(this.scale.width, this.scale.height);

        // 初始化對話管理器
        this.dialogueManager = new DialogueManager(this);

        // 初始化主題對話管理器
        this.topicDialogueManager = new TopicDialogueManager(this);

        // 監聽主題對話管理器的更新事件
        this.events.on(
            "update-characters-dialogue",
            this.handleUpdateCharactersDialogue
        );

        // 初始化 NPC 管理器並載入所有人物資料
        this.npcManager = new NPCManager(this);
        this.loadCharactersAndNPCs().then(() => {
            // 通知場景準備完成
            EventBus.emit("current-scene-ready", this);
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.dialogueManager.destroy();
            this.npcManager?.destroy();
            this.topicDialogueManager?.destroy();
            this.events.off(
                "update-characters-dialogue",
                this.handleUpdateCharactersDialogue
            );
        });

        // 監聽來自 Svelte 的自訂對話資料
        EventBus.on(
            "set-custom-dialogue",
            (data: {
                characters: DialogueCharacter[] | null;
                topic?: string;
            }) => {
                this.customCharacters = data.characters;
                if (data.characters) {
                    // 有主題對話，更新對話並確保輸入框隱藏
                    this.updateCharactersDialogue(data.characters);
                    this.topicDialogueManager.hideTopicInput();
                    if (data.topic) {
                        this.topicDialogueManager.setCurrentTopic(data.topic);
                    }
                } else {
                    // 沒有自訂對話，顯示輸入框
                    this.topicDialogueManager.showTopicInput();
                }
            }
        );

        // 監聽 API pending 狀態（SplashScreen 完成但 API 還在進行）
        EventBus.on("set-custom-dialogue-pending", () => {
            this.topicDialogueManager.showLoadingOverlay("需求討論中..");

            // 等待後續的 success 或 error 事件
            const handleSuccess = () => {
                this.topicDialogueManager.hideLoadingOverlay();
                EventBus.off("set-custom-dialogue", handleSuccess);
                EventBus.off("set-custom-dialogue-error", handleError);
            };

            const handleError = () => {
                EventBus.off("set-custom-dialogue", handleSuccess);
                EventBus.off("set-custom-dialogue-error", handleError);
            };

            EventBus.once("set-custom-dialogue", handleSuccess);
            EventBus.once("set-custom-dialogue-error", handleError);
        });

        // 監聽 API 錯誤狀態
        EventBus.on(
            "set-custom-dialogue-error",
            (data: { error: string }) => {
                this.topicDialogueManager.showErrorOverlay(
                    data.error || "提案失敗",
                    2000
                );

                // 2 秒後顯示輸入框，並保持預設對話
                this.time.delayedCall(2000, () => {
                    this.topicDialogueManager.showTopicInput();
                });
            }
        );

        this.exposeDebugHelpers();
    }

    /**
     * 配置背景佈局（與 V1 完全一致）
     */
    private configureBackgroundLayout(
        gameWidth: number,
        gameHeight: number
    ): void {
        const background = this.backgroundImage;
        if (!background) return;

        const naturalWidth = this.sourceBackgroundWidth;
        const naturalHeight = this.sourceBackgroundHeight;

        const fitScale = Math.min(
            gameWidth / naturalWidth,
            gameHeight / naturalHeight
        );
        const displayWidth = naturalWidth * fitScale;
        const displayHeight = naturalHeight * fitScale;
        const offsetX = (gameWidth - displayWidth) / 2;
        const offsetY = (gameHeight - displayHeight) / 2;

        background
            .setDisplaySize(displayWidth, displayHeight)
            .setPosition(
                offsetX + displayWidth / 2,
                offsetY + displayHeight / 2
            )
            .setScrollFactor(0);

        this.backgroundScale = fitScale;
        this.backgroundScaleX = displayWidth / naturalWidth;
        this.backgroundScaleY = displayHeight / naturalHeight;
        this.backgroundOffsetX = offsetX;
        this.backgroundOffsetY = offsetY;
        this.backgroundDisplayWidth = displayWidth;
        this.backgroundDisplayHeight = displayHeight;

        // 如果已經有 hotspots，需要重新應用座標轉換
        if (this.roundTableHotspots.length) {
            this.roundTableHotspots.forEach((entry) => {
                this.applyWorldTransformToHotspot(entry);
            });
        }
    }

    /**
     * 座標轉換方法（與 V1 完全一致）
     */
    private dataToWorldX(value: number): number {
        const scaleX = this.backgroundScaleX || 1;
        return value * scaleX + this.backgroundOffsetX;
    }

    private dataToWorldY(value: number): number {
        const scaleY = this.backgroundScaleY || 1;
        return value * scaleY + this.backgroundOffsetY;
    }

    private transformNpcCoordinates(npc: HotspotNPC) {
        const x = this.dataToWorldX(npc.x);
        const y = this.dataToWorldY(npc.y);
        const scaleX = this.backgroundScaleX || 1;
        const scaleY = this.backgroundScaleY || 1;
        const radius = npc.radius * Math.max(scaleX, scaleY);
        const bubbleOffsetX =
            typeof npc.bubbleOffsetX === "number"
                ? npc.bubbleOffsetX * scaleX
                : undefined;
        const bubbleOffsetY =
            typeof npc.bubbleOffsetY === "number"
                ? npc.bubbleOffsetY * scaleY
                : undefined;
        const bubbleGap =
            typeof npc.bubbleGap === "number"
                ? npc.bubbleGap * Math.max(scaleX, scaleY)
                : undefined;

        return {
            x,
            y,
            radius,
            bubbleOffsetX,
            bubbleOffsetY,
            bubbleGap,
        };
    }

    /**
     * 載入角色資料和 NPC
     */
    private async loadCharactersAndNPCs(): Promise<void> {
        try {
            // 載入 NPC 基本資料
            const data = await this.npcManager.loadNPCData();

            // 建立人物資料庫
            data.characters.forEach((character) => {
                this.characters.set(character.id, character);
            });

            // 初始化 DialogueManager 的預設對話（從 characters.json）
            // 將每個角色的單句 dialogue 轉換為 3 則相同的對話
            const defaultDialogues: DialogueCharacter[] = data.characters.map(
                (char) => ({
                    id: char.id,
                    name: char.name,
                    position: char.position,
                    dialogues: [char.dialogue, char.dialogue, char.dialogue] as [
                        string,
                        string,
                        string
                    ],
                })
            );
            this.dialogueManager.setCharacterDialogues(defaultDialogues);

            // 創建圓桌 hotspot NPC
            this.createRoundTableHotspots(data.hotspotNpcs);
        } catch (error) {
            console.error("載入 NPC 資料失敗:", error);
        }
    }

    /**
     * 更新角色對話（從 API 取得的新對話）
     */
    private updateCharactersDialogue(newCharacters: DialogueCharacter[]): void {
        // 1. 更新 customCharacters
        this.customCharacters = newCharacters;

        // 2. 將 對話資料傳給 DialogueManager
        this.dialogueManager.setCharacterDialogues(newCharacters);

        // 3. 更新 NPCManager 的對話資料（供顯示用）
        this.npcManager.updateDialoguesFromAPI(newCharacters);

        // 4. 可選：自動顯示某個角色的第一則對話
        this.autoShowFirstDialogue();
    }

    /**
     * 自動顯示 Steven 的第一則對話（可選）
     */
    private autoShowFirstDialogue(): void {
        // 先嘗試從站立 NPC 中找 Steven
        let stevenNPC = this.npcManager.getNPC("Steven");

        // 如果沒找到，從 hotspot 中找
        if (!stevenNPC) {
            const stevenHotspot = this.roundTableHotspots.find(
                (hotspot) => hotspot.npc.id === "Steven"
            );

            if (stevenHotspot) {
                // 延遲一點時間以確保場景完全準備好
                this.time.delayedCall(500, () => {
                    const { world } = stevenHotspot;
                    this.events.emit("show-dialogue", {
                        npcId: stevenHotspot.npc.id,
                        name: stevenHotspot.npc.name,
                        x: world.x,
                        y: world.y,
                        radius: world.radius,
                        bubbleOffsetX: world.bubbleOffsetX,
                        bubbleOffsetY: world.bubbleOffsetY,
                        bubbleGap: world.bubbleGap,
                    });
                });
                return;
            }
        } else {
            this.time.delayedCall(500, () => {
                stevenNPC!.showDialogue();
            });
            return;
        }
    }

    /**
     * 創建圓桌 hotspot NPC（版本）
     */
    private createRoundTableHotspots(configs: HotspotNpcConfig[]): void {
        this.roundTableHotspots = configs
            .map((config) => {
                const character = this.characters.get(config.characterId);
                if (!character) {
                    console.warn(
                        `Character not found for hotspot NPC: ${config.characterId}`
                    );
                    return null;
                }

                // 構建 HotspotNPC 資料
                const npcData: HotspotNPC = {
                    id: character.id,
                    name: character.name,
                    dialogue: character.dialogue,
                    x: config.x,
                    y: config.y,
                    radius: config.radius,
                    bubbleOffsetX: config.bubbleOffsetX,
                    bubbleOffsetY: config.bubbleOffsetY,
                    bubbleGap: config.bubbleGap,
                };

                const zone = this.add
                    .zone(0, 0, 0, 0)
                    .setOrigin(0.5, 0.5)
                    .setDepth(1000);

                zone.setInteractive(
                    new Phaser.Geom.Circle(0, 0, 1),
                    Phaser.Geom.Circle.Contains
                );

                const debugVisual = this.add.graphics();
                debugVisual.lineStyle(2, 0xffcc00, 0.9);
                debugVisual.fillStyle(0xffcc00, 0.15);
                debugVisual.setDepth(2499);
                debugVisual.setVisible(false);

                const debugLabel = this.add
                    .text(0, 0, character.name, {
                        fontSize: "14px",
                        color: "#ffcc00",
                        backgroundColor: "rgba(0, 0, 0, 0.65)",
                        padding: { x: 6, y: 4 },
                    })
                    .setOrigin(0.5)
                    .setDepth(2500)
                    .setVisible(false);

                // 創建名字標籤（初始隱藏）
                const nameLabel = this.add
                    .text(0, 0, character.name, {
                        fontSize: "14px",
                        color: "#0b1f66",
                        fontFamily: "Arial",
                        fontStyle: "bold",
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                        padding: { x: 6, y: 3 },
                    })
                    .setOrigin(0.5)
                    .setDepth(2501)
                    .setVisible(false);

                const entry = {
                    zone,
                    npc: npcData,
                    world: {
                        x: 0,
                        y: 0,
                        radius: 0,
                        bubbleOffsetX: undefined as number | undefined,
                        bubbleOffsetY: undefined as number | undefined,
                        bubbleGap: undefined as number | undefined,
                    },
                    debugVisual,
                    debugLabel,
                    nameLabel,
                    isHovering: false,
                    isDialogueActive: false,
                };

                zone.on("pointerover", () => {
                    this.input.setDefaultCursor("pointer");
                    entry.isHovering = true;
                    nameLabel.setVisible(true);
                });

                zone.on("pointerout", () => {
                    this.input.setDefaultCursor("default");
                    entry.isHovering = false;
                    if (!entry.isDialogueActive) {
                        nameLabel.setVisible(false);
                    }
                });

                zone.on("pointerdown", () => {
                    const { world } = entry;
                    // 發送 show-dialogue 事件
                    this.events.emit("show-dialogue", {
                        npcId: npcData.id,
                        name: character.name,
                        x: world.x,
                        y: world.y,
                        radius: world.radius,
                        bubbleOffsetX: world.bubbleOffsetX,
                        bubbleOffsetY: world.bubbleOffsetY,
                        bubbleGap: world.bubbleGap,
                    });
                });

                return entry;
            })
            .filter(
                (entry) => entry !== null
            ) as typeof this.roundTableHotspots;

        // 應用世界座標轉換到所有 hotspots
        this.roundTableHotspots.forEach((entry) => {
            this.applyWorldTransformToHotspot(entry);
        });

        // 監聽對話事件以更新名牌顯示
        this.events.on("dialogue-shown", (npcId: string) => {
            const entry = this.roundTableHotspots.find(
                (e) => e.npc.id === npcId
            );
            if (entry) {
                entry.isDialogueActive = true;
                entry.nameLabel.setVisible(true);
            }
        });

        this.events.on("dialogue-hidden", (npcId: string) => {
            const entry = this.roundTableHotspots.find(
                (e) => e.npc.id === npcId
            );
            if (entry) {
                entry.isDialogueActive = false;
                if (!entry.isHovering) {
                    entry.nameLabel.setVisible(false);
                }
            }
        });
    }

    /**
     * 應用世界座標轉換到 hotspot（與 V1 完全一致）
     */
    private applyWorldTransformToHotspot(
        entry: (typeof this.roundTableHotspots)[number]
    ): void {
        const { npc, zone, debugVisual, debugLabel, nameLabel, world } = entry;
        const transformed = this.transformNpcCoordinates(npc);

        world.x = transformed.x;
        world.y = transformed.y;
        world.radius = transformed.radius;
        world.bubbleOffsetX = transformed.bubbleOffsetX;
        world.bubbleOffsetY = transformed.bubbleOffsetY;
        world.bubbleGap = transformed.bubbleGap;

        zone.setPosition(world.x, world.y);
        (zone.input!.hitArea as Phaser.Geom.Circle).setTo(0, 0, world.radius);

        // 將 debugVisual 移動到世界座標位置，然後在 (0, 0) 繪製圓形
        debugVisual.setPosition(world.x, world.y);
        debugVisual.clear();
        debugVisual.lineStyle(2, 0xffcc00, 0.9);
        debugVisual.strokeCircle(0, 0, world.radius);
        debugVisual.fillStyle(0xffcc00, 0.15);
        debugVisual.fillCircle(0, 0, world.radius);

        debugLabel.setPosition(world.x, world.y - world.radius - 12);

        // 名字標籤位置：圓心正上方（下移 10 像素）
        nameLabel.setPosition(world.x, world.y - world.radius - 10);
    }

    /**
     * 暴露除錯輔助方法
     */
    private exposeDebugHelpers(): void {
        (window as any).gameScene = this;
        (window as any).getDialogueManager = () => this.dialogueManager;
        (window as any).getNPCManager = () => this.npcManager;
        (window as any).getClickCount = (npcId: string) => {
            return this.dialogueManager.getClickCount(npcId);
        };
        (window as any).resetClickCounts = () => {
            this.dialogueManager.resetAllClickCounts();
        };
    }

    update() {
        // 版本的更新邏輯（目前不需要特別處理）
    }
}
