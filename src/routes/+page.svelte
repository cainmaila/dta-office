<script lang="ts">
    import { onMount } from "svelte";
    import type { Scene } from "phaser";
    import PhaserGame, { type TPhaserRef } from "../PhaserGame.svelte";
    import { EventBus } from "../game/EventBus";
    import { fetchTeamDialogue } from "../lib/api/teamDialogue";

    //  References to the PhaserGame component (game and scene are exposed)
    let phaserRef: TPhaserRef = { game: null, scene: null };
    let isLoadingTopic = false;

    onMount(() => {
        // 檢查 URL query 參數
        const urlParams = new URLSearchParams(window.location.search);
        const topic = urlParams.get("topic");

        if (topic) {
            loadTopicDialogue(topic);
        } else {
            // 沒有主題參數，等待場景準備好後顯示輸入框
            EventBus.once("current-scene-ready", () => {
                EventBus.emit("set-custom-dialogue", {
                    characters: null,
                });
            });
        }
    });

    /**
     * 載入主題對話
     */
    async function loadTopicDialogue(topic: string): Promise<void> {
        if (isLoadingTopic) return;

        isLoadingTopic = true;

        try {
            const response = await fetchTeamDialogue(topic, 60000);

            // 等待場景準備好
            EventBus.once("current-scene-ready", () => {
                EventBus.emit("set-custom-dialogue", {
                    characters: response.characters,
                    topic: topic,
                });
            });
        } catch (error) {
            console.error("載入主題對話失敗:", error);

            // 失敗時顯示輸入框
            EventBus.once("current-scene-ready", () => {
                EventBus.emit("set-custom-dialogue", {
                    characters: null,
                });
            });
        } finally {
            isLoadingTopic = false;
        }
    }
</script>

<div id="app">
    <PhaserGame bind:phaserRef />
</div>

<style>
    #app {
        width: 100%;
        height: 100vh;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000000;
    }
</style>
