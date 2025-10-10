<script context="module" lang="ts">
    import type { Game, Scene } from "phaser";

    export type TPhaserRef = {
        game: Game | null;
        scene: Scene | null;
    };
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import StartGame from "./game/main";
    import { EventBus } from "./game/EventBus";

    export let phaserRef: TPhaserRef = {
        game: null,
        scene: null,
    };

    export let currentActiveScene: ((scene: Scene) => void) | undefined =
        undefined;

    // 新增：允許指定要使用的 scene（"v1" 或 "v2"）
    export let sceneVersion: "v1" | "v2" = "v1";

    onMount(() => {
        phaserRef.game = StartGame("game-container", sceneVersion);

        EventBus.on("current-scene-ready", (scene_instance: Scene) => {
            phaserRef.scene = scene_instance;

            if (currentActiveScene) {
                currentActiveScene(scene_instance);
            }
        });
    });
</script>

<div id="game-container"></div>
