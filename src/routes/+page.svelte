<script lang="ts">
    import { onMount } from "svelte";
    import type { Scene } from "phaser";
    import PhaserGame, { type TPhaserRef } from "../PhaserGame.svelte";
    import { EventBus } from "../game/EventBus";
    import { fetchTeamDialogue, type Character } from "../lib/api/teamDialogue";

    //  References to the PhaserGame component (game and scene are exposed)
    let phaserRef: TPhaserRef = { game: null, scene: null };
    let initialDialogueData: {
        characters: Character[] | null;
        topic?: string;
    } | null = null;

    onMount(async () => {
        // 直接檢查 URL query 參數並載入
        const urlParams = new URLSearchParams(window.location.search);
        const topic = urlParams.get("topic");

        if (topic) {
            // 有主題，立即載入對話
            try {
                const response = await fetchTeamDialogue(topic, 60000);

                initialDialogueData = {
                    characters: response.characters,
                    topic: topic,
                };
            } catch (error) {
                console.error("載入主題對話失敗:", error);
                initialDialogueData = { characters: null };
            }
        } else {
            // 沒有主題，顯示輸入框
            initialDialogueData = { characters: null };
        }

        // 等待場景準備好後發送資料
        EventBus.once("current-scene-ready", () => {
            if (initialDialogueData) {
                EventBus.emit("set-custom-dialogue", initialDialogueData);
            }
        });
    });
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
