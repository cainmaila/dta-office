export interface BackgroundAssetConfig {
    key: string;
    file: string;
}

export interface NPCSpriteSheetConfig {
    key: string;
    file: string;
    frameWidth: number;
    frameHeight: number;
}

export interface AssetsConfig {
    basePath: string;
    background: BackgroundAssetConfig;
    npcSpriteSheet: NPCSpriteSheetConfig;
    npcData: string;
}

export interface DialogueStandingConfig {
    baseOffsetY: number;
    extraOffsetY: number;
    bubbleGap: number;
}

export interface DialogueBoundsConfig {
    minX: number;
    maxX: number;
    minY: number;
}

export interface DialogueConfig {
    standing: DialogueStandingConfig;
    bounds: DialogueBoundsConfig;
}

export interface GameConfig {
    assets: AssetsConfig;
    dialogue: DialogueConfig;
}
