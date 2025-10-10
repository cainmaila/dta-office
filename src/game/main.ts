import { Game as MainGame } from "./scenes/Game";
import { GameV2 } from "./scenes/GameV2";
import { AUTO, Game } from "phaser";
import type { Types } from "phaser";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 1024,
    parent: "game-container",
    backgroundColor: "#000000",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    dom: {
        createContainer: true,
    },
    scene: [MainGame],
};

const StartGame = (parent: string, sceneVersion: "v1" | "v2" = "v1") => {
    const selectedScene = sceneVersion === "v2" ? GameV2 : MainGame;
    return new Game({ ...config, parent, scene: [selectedScene] });
};

export default StartGame;
