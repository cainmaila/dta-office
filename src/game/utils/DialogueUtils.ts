import type { DialogueEventPayload } from "../types/NPCTypes";
import { gameConfig } from "../config";

export interface BubbleGeometry {
    height: number;
    tailSize: number;
}

export interface BubblePlacementBounds {
    minX: number;
    maxX: number;
    minY: number;
}

export function resolveStandingBubbleOffset(extraOffset: number = 0): number {
    return gameConfig.dialogue.standing.baseOffsetY + extraOffset;
}

export function computeBubblePosition(
    payload: DialogueEventPayload,
    geometry: BubbleGeometry,
    bounds: BubblePlacementBounds = gameConfig.dialogue.bounds
): { x: number; y: number } {
    const {
        x: anchorX,
        y: anchorY,
        radius,
        bubbleOffsetX = 0,
        bubbleOffsetY,
        bubbleGap,
    } = payload;

    let targetY: number;

    if (typeof radius === "number") {
        const gap = bubbleGap ?? 12;
        const baseY =
            anchorY - radius - geometry.tailSize - geometry.height / 2 - gap;
        targetY = baseY + (bubbleOffsetY ?? 0);
    } else {
        const baseOffset = resolveStandingBubbleOffset();
        targetY = anchorY + baseOffset + (bubbleOffsetY ?? 0);
    }

    const clampedX = Math.max(
        bounds.minX,
        Math.min(anchorX + bubbleOffsetX, bounds.maxX)
    );
    const clampedY = Math.max(bounds.minY, targetY);

    return { x: clampedX, y: clampedY };
}
