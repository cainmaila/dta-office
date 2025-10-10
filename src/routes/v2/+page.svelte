<script lang="ts">
    import { onMount } from "svelte";
    import type { Scene } from "phaser";
    import PhaserGame, { type TPhaserRef } from "../../PhaserGame.svelte";
    import { EventBus } from "../../game/EventBus";
    import {
        fetchTeamDialogueV2,
        type CharacterV2,
    } from "../../lib/api/teamDialogueV2";
    import { SoundManager } from "../../game/utils/SoundManager";

    //  References to the PhaserGame component (game and scene are exposed)
    let phaserRef: TPhaserRef = { game: null, scene: null };
    let initialDialogueData: {
        characters: CharacterV2[] | null;
        topic?: string;
    } | null = null;

    onMount(async () => {
        // 直接檢查 URL query 參數並載入
        const urlParams = new URLSearchParams(window.location.search);
        const topic = urlParams.get("topic");

        if (topic) {
            // 有主題，立即載入對話
            try {
                const response = await fetchTeamDialogueV2(topic, 60000);

                // 播放 API 回應音效
                SoundManager.playSound("/sound/quiz-start.mp3", 0.5);

                initialDialogueData = {
                    characters: response.characters,
                    topic: topic,
                };
            } catch (error) {
                console.error("V2: 載入主題對話失敗:", error);
                initialDialogueData = { characters: null };
            }
        } else {
            // 沒有主題，顯示輸入框
            initialDialogueData = { characters: null };
        }

        // 等待場景準備好後發送資料
        EventBus.once("current-scene-ready", () => {
            if (initialDialogueData) {
                EventBus.emit("set-custom-dialogue-v2", initialDialogueData);
            }
        });
    });
</script>

<div id="app">
    <PhaserGame bind:phaserRef sceneVersion="v2" />
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
