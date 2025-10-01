import {
    NPC_STYLES,
    type NPCStyle,
    type NPCStyleFrames,
} from "../data/npcStyles";

export function getStyleById(styleId: string): NPCStyle | undefined {
    return NPC_STYLES[styleId];
}

export function getAllStyles(): NPCStyle[] {
    return Object.values(NPC_STYLES);
}

export function getRecommendedStyles(position: string): NPCStyle[] {
    return getAllStyles().filter((style) =>
        style.recommendedFor.some(
            (role) => position.includes(role) || role.includes(position)
        )
    );
}

export function getFrameForAction(
    styleId: string,
    action: keyof NPCStyleFrames,
    frameIndex: number = 0
): number {
    const style = getStyleById(styleId);
    if (!style) return 0;

    const frames = style.frames[action];
    if (!frames || frames.length === 0) return style.defaultFrame;

    return frames[frameIndex % frames.length];
}
