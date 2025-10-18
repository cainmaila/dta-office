<script module lang="ts">
    import type { Game, Scene } from "phaser";

    export type TPhaserRef = {
        game: Game | null;
        scene: Scene | null;
    };
</script>

<script lang="ts">
    import StartGame from "./game/main";
    import { EventBus } from "./game/EventBus";

    let {
        phaserRef = $bindable({ game: null, scene: null }),
        currentActiveScene = undefined,
    }: {
        phaserRef?: TPhaserRef;
        currentActiveScene?: ((scene: Scene) => void) | undefined;
    } = $props();

    $effect(() => {
        // 初始化 Phaser 遊戲
        try {
            phaserRef.game = StartGame("game-container");
        } catch (error) {
            console.error("Phaser game initialization failed:", error);
            return;
        }

        // 監聽場景準備事件
        const sceneReadyHandler = (scene_instance: Scene) => {
            phaserRef.scene = scene_instance;

            if (currentActiveScene) {
                currentActiveScene(scene_instance);
            }
        };

        EventBus.on("current-scene-ready", sceneReadyHandler);

        // 清理函數
        return () => {
            EventBus.off("current-scene-ready", sceneReadyHandler);
            // 在元件銷毀時清理遊戲實例
            if (phaserRef.game) {
                phaserRef.game.destroy(true);
                phaserRef.game = null;
                phaserRef.scene = null;
            }
        };
    });
</script>

<div id="game-container"></div>
