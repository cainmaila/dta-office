import Phaser, { Scene, Scenes } from "phaser";
import { EventBus } from "../EventBus";
import { DialogueManager } from "../managers/DialogueManager";
import { NPCManager } from "../managers/NPCManager";
import type {
    HotspotNPC,
    CharactersData,
    Character,
    HotspotNpcConfig,
} from "../types/NPCTypes";
import { gameConfig } from "../config";

export class Game extends Scene {
    private dialogueManager!: DialogueManager;
    private npcManager!: NPCManager;
    private characters: Map<string, Character> = new Map(); // 人物資料庫
    private hotspotDebugEnabled = false;
    private hotspotDebugText?: Phaser.GameObjects.Text;
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
    private cachedWorldBounds: {
        topLeft: Phaser.Math.Vector2;
        bottomRight: Phaser.Math.Vector2;
        width: number;
        height: number;
    } | null = null;
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

        this.configureBackgroundLayout(this.scale.width, this.scale.height, {
            log: true,
        });

        // 初始化對話管理器
        this.dialogueManager = new DialogueManager(this);

        // 初始化 NPC 管理器並載入所有人物資料
        this.npcManager = new NPCManager(this);
        this.loadCharactersAndNPCs();

        this.events.once(Scenes.Events.SHUTDOWN, () => {
            this.dialogueManager.destroy();
            this.npcManager?.destroy();
            this.roundTableHotspots.forEach(
                ({ zone, debugVisual, debugLabel, nameLabel }) => {
                    zone.destroy();
                    debugVisual.destroy();
                    debugLabel.destroy();
                    nameLabel.destroy();
                }
            );
            this.roundTableHotspots = [];
        });

        // 監聽對話框事件以更新熱區名字標籤
        this.events.on("dialogue-shown", (payload: { npcId?: string }) => {
            if (payload.npcId) {
                const entry = this.roundTableHotspots.find(
                    (e) => e.npc.id === payload.npcId
                );
                if (entry) {
                    entry.isDialogueActive = true;
                    this.updateHotspotNameLabelVisibility(entry);
                }
            }
        });

        this.events.on("dialogue-hidden", (payload: { npcId?: string }) => {
            if (payload.npcId) {
                const entry = this.roundTableHotspots.find(
                    (e) => e.npc.id === payload.npcId
                );
                if (entry) {
                    entry.isDialogueActive = false;
                    this.updateHotspotNameLabelVisibility(entry);
                }
            }
        });

        this.exposeDebugHelpers();

        this.setupHotspotDebugger();

        // 通知場景準備完成
        EventBus.emit("current-scene-ready", this);
    }

    private async loadCharactersAndNPCs(): Promise<void> {
        try {
            // 載入人物資料
            const response = await fetch(
                `${gameConfig.assets.basePath}/data/characters.json`
            );
            const data: CharactersData = await response.json();

            // 建立人物資料庫
            data.characters.forEach((character) => {
                this.characters.set(character.id, character);
            });

            // 載入站立 NPC（透過 NPCManager）
            await this.npcManager.loadNPCData();
            this.npcManager.createNPCs();

            // 建立熱區 NPC
            this.createRoundTableHotspots(data.hotspotNpcs);
        } catch (error) {
            console.error("Failed to load characters and NPCs:", error);
        }
    }

    private recalculateWorldBounds(): void {
        const topLeft = this.cameras.main.getWorldPoint(0, 0);
        const bottomRight = this.cameras.main.getWorldPoint(
            this.scale.gameSize.width,
            this.scale.gameSize.height
        );

        this.cachedWorldBounds = {
            topLeft,
            bottomRight,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y,
        };
    }

    private configureBackgroundLayout(
        gameWidth: number,
        gameHeight: number,
        options: { log?: boolean } = {}
    ): void {
        const background = this.backgroundImage;
        const naturalWidth = this.sourceBackgroundWidth;
        const naturalHeight = this.sourceBackgroundHeight;

        if (!background || !naturalWidth || !naturalHeight) {
            return;
        }

        const fitScale = Math.min(
            gameWidth / naturalWidth,
            gameHeight / naturalHeight
        );
        const displayWidth = naturalWidth * fitScale;
        const displayHeight = naturalHeight * fitScale;
        const offsetX = (gameWidth - displayWidth) / 2;
        const offsetY = (gameHeight - displayHeight) / 2;

        if (options.log) {
            console.warn(
                `🖼️ ${
                    gameConfig.assets.background.key
                } texture ${naturalWidth}x${naturalHeight} scaled to ${displayWidth.toFixed(
                    1
                )}x${displayHeight.toFixed(1)} (scale=${fitScale.toFixed(
                    4
                )}) with offset (${offsetX.toFixed(1)}, ${offsetY.toFixed(
                    1
                )}) to fit canvas ${gameWidth}x${gameHeight}`
            );
        }

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

        this.recalculateWorldBounds();

        if (this.roundTableHotspots.length) {
            this.roundTableHotspots.forEach((entry) => {
                this.applyWorldTransformToHotspot(entry);
            });
        }
    }

    private exposeDebugHelpers(): void {
        if (!(import.meta as any).env?.DEV) {
            return;
        }

        const win = window as typeof window & {
            __DTA_DEBUG__?: {
                scene: Scene;
                backgroundScale: number;
                backgroundScaleX: number;
                backgroundScaleY: number;
                backgroundOffset: { x: number; y: number };
                worldBounds: {
                    topLeft: { x: number; y: number };
                    bottomRight: { x: number; y: number };
                } | null;
                dataToWorld: (x: number, y: number) => { x: number; y: number };
                worldToData: (x: number, y: number) => { x: number; y: number };
                listHotspots: () => Array<{
                    id: string;
                    name: string;
                    data: { x: number; y: number; radius: number };
                    world: {
                        x: number;
                        y: number;
                        radius: number;
                        bubbleGap?: number;
                        bubbleOffsetX?: number;
                        bubbleOffsetY?: number;
                    };
                }>;
                triggerHotspot: (id: string) => boolean;
                triggerAllHotspots: (options?: {
                    delay?: number;
                    loop?: boolean;
                }) => void;
            };
        };

        win.__DTA_DEBUG__ = {
            scene: this,
            backgroundScale: this.backgroundScale,
            backgroundScaleX: this.backgroundScaleX,
            backgroundScaleY: this.backgroundScaleY,
            backgroundOffset: {
                x: this.backgroundOffsetX,
                y: this.backgroundOffsetY,
            },
            worldBounds: this.cachedWorldBounds
                ? {
                      topLeft: {
                          x: this.cachedWorldBounds.topLeft.x,
                          y: this.cachedWorldBounds.topLeft.y,
                      },
                      bottomRight: {
                          x: this.cachedWorldBounds.bottomRight.x,
                          y: this.cachedWorldBounds.bottomRight.y,
                      },
                  }
                : null,
            dataToWorld: (x: number, y: number) => ({
                x: this.dataToWorldX(x),
                y: this.dataToWorldY(y),
            }),
            worldToData: (x: number, y: number) => ({
                x: this.worldToDataX(x),
                y: this.worldToDataY(y),
            }),
            listHotspots: () =>
                this.roundTableHotspots.map((entry) => ({
                    id: entry.npc.id,
                    name: entry.npc.name,
                    data: {
                        x: entry.npc.x,
                        y: entry.npc.y,
                        radius: entry.npc.radius,
                    },
                    world: {
                        x: entry.world.x,
                        y: entry.world.y,
                        radius: entry.world.radius,
                        bubbleGap: entry.world.bubbleGap,
                        bubbleOffsetX: entry.world.bubbleOffsetX,
                        bubbleOffsetY: entry.world.bubbleOffsetY,
                    },
                })),
            triggerHotspot: (id: string) => {
                const entry = this.roundTableHotspots.find(
                    (candidate) => candidate.npc.id === id
                );

                if (!entry) {
                    console.warn(`⚠️ Hotspot ${id} not found.`);
                    return false;
                }

                this.simulateHotspotInteraction(entry);
                return true;
            },
            triggerAllHotspots: (options?: {
                delay?: number;
                loop?: boolean;
            }) => {
                if (!this.roundTableHotspots.length) {
                    console.warn("⚠️ No hotspots are registered yet.");
                    return;
                }

                const sequence = [...this.roundTableHotspots];
                const delay = options?.delay ?? 900;
                const loop = options?.loop ?? false;

                const runSequence = (index: number) => {
                    if (index >= sequence.length) {
                        if (loop) {
                            this.time.delayedCall(delay, () => runSequence(0));
                        }
                        return;
                    }

                    this.simulateHotspotInteraction(sequence[index]);
                    this.time.delayedCall(delay, () => runSequence(index + 1));
                };

                runSequence(0);
            },
        };
    }

    private dataToWorldX(value: number): number {
        const scaleX = this.backgroundScaleX || 1;
        return value * scaleX + this.backgroundOffsetX;
    }

    private dataToWorldY(value: number): number {
        const scaleY = this.backgroundScaleY || 1;
        return value * scaleY + this.backgroundOffsetY;
    }

    private worldToDataX(value: number): number {
        const scaleX = this.backgroundScaleX || 1;
        return (value - this.backgroundOffsetX) / scaleX;
    }

    private worldToDataY(value: number): number {
        const scaleY = this.backgroundScaleY || 1;
        return (value - this.backgroundOffsetY) / scaleY;
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
                ? npc.bubbleGap * scaleY
                : undefined;

        return { x, y, radius, bubbleOffsetX, bubbleOffsetY, bubbleGap };
    }

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
                        color: "#333333",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
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

                this.applyWorldTransformToHotspot(entry);

                zone.on("pointerover", () => {
                    this.input.setDefaultCursor("pointer");
                    entry.isHovering = true;
                    this.updateHotspotNameLabelVisibility(entry);
                    if (this.hotspotDebugEnabled) {
                        debugVisual.setVisible(true);
                        debugLabel.setVisible(true);
                    }
                });

                zone.on("pointerout", () => {
                    this.input.setDefaultCursor("default");
                    entry.isHovering = false;
                    this.updateHotspotNameLabelVisibility(entry);
                    if (this.hotspotDebugEnabled) {
                        debugVisual.setVisible(true);
                        debugLabel.setVisible(true);
                    } else {
                        debugVisual.setVisible(false);
                        debugLabel.setVisible(false);
                    }
                });

                zone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
                    const { world } = entry;
                    this.events.emit("show-dialogue", {
                        npcId: npcData.id,
                        name: character.name,
                        message: character.dialogue,
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
                (entry): entry is NonNullable<typeof entry> => entry !== null
            );
    }

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

    private updateHotspotNameLabelVisibility(
        entry: (typeof this.roundTableHotspots)[number]
    ): void {
        const shouldShow = entry.isHovering || entry.isDialogueActive;
        entry.nameLabel.setVisible(shouldShow);
    }

    private simulateHotspotInteraction(
        entry: (typeof this.roundTableHotspots)[number]
    ): void {
        const pointer = this.input.activePointer;
        const worldX = entry.world.x;
        const worldY = entry.world.y;

        pointer.worldX = worldX;
        pointer.worldY = worldY;
        pointer.x = worldX;
        pointer.y = worldY;
        pointer.downX = worldX;
        pointer.downY = worldY;
        pointer.isDown = true;

        entry.zone.emit("pointerover", pointer, 0, 0);
        entry.zone.emit("pointerdown", pointer, 0, 0);

        pointer.isDown = false;

        entry.zone.emit("pointerup", pointer, 0, 0);
        entry.zone.emit("pointerout", pointer, 0, 0);
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
            this.hotspotDebugText?.setVisible(this.hotspotDebugEnabled);
            this.roundTableHotspots.forEach(
                ({ debugVisual, debugLabel, world }) => {
                    debugVisual.setVisible(this.hotspotDebugEnabled);
                    debugLabel.setVisible(this.hotspotDebugEnabled);
                    if (this.hotspotDebugEnabled) {
                        debugVisual.setPosition(world.x, world.y);
                        // debugLabel.setPosition(world.x, world.y - world.radius);
                        debugLabel.setPosition(world.x, world.y - world.radius);
                    }
                }
            );
        });

        const resizeHandler = (
            gameSize: Phaser.Structs.Size,
            _baseSize: Phaser.Structs.Size,
            _displaySize: Phaser.Structs.Size,
            _resolution: number
        ) => {
            this.configureBackgroundLayout(gameSize.width, gameSize.height, {
                log: true,
            });
            this.exposeDebugHelpers();
        };

        this.scale.on("resize", resizeHandler);
        this.events.once(Scenes.Events.SHUTDOWN, () => {
            this.scale.off("resize", resizeHandler);
        });

        // 移動時更新螢幕顯示
        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (!this.hotspotDebugEnabled || !this.hotspotDebugText) {
                return;
            }

            const worldX = Math.round(pointer.worldX);
            const worldY = Math.round(pointer.worldY);
            const dataX = Math.round(this.worldToDataX(pointer.worldX));
            const dataY = Math.round(this.worldToDataY(pointer.worldY));
            this.hotspotDebugText.setText(
                `world x: ${worldX}\nworld y: ${worldY}\ndata x: ${dataX}\ndata y: ${dataY}`
            );
        });

        // 點擊時輸出座標
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (!this.hotspotDebugEnabled) {
                return;
            }
        });
    }
}
