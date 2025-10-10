<script lang="ts">
    import { onMount } from "svelte";
    import type { Scene } from "phaser";
    import PhaserGame, { type TPhaserRef } from "../PhaserGame.svelte";
    import SplashScreen from "../components/SplashScreen.svelte";
    import { EventBus } from "../game/EventBus";
    import {
        fetchTeamDialogue,
        type DialogueCharacter,
    } from "../lib/api/teamDialogue";
    import { SoundManager } from "../game/utils/SoundManager";

    //  References to the PhaserGame component (game and scene are exposed)
    let phaserRef: TPhaserRef = { game: null, scene: null };
    let initialDialogueData: {
        characters: DialogueCharacter[] | null;
        topic?: string;
    } | null = null;
    let showSplash = true;
    let gameReady = false;

    function handleSplashComplete() {
        showSplash = false;
        gameReady = true;
    }

    onMount(async () => {
        // 直接檢查 URL query 參數並載入
        const urlParams = new URLSearchParams(window.location.search);
        const topic = urlParams.get("topic");

        if (topic) {
            // 有主題，立即載入對話
            try {
                const response = await fetchTeamDialogue(topic, 60000);

                // 播放 API 回應音效
                SoundManager.playSound("/sound/quiz-start.mp3", 0.5);

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

{#if showSplash}
    <SplashScreen onComplete={handleSplashComplete} />
{/if}

<div id="app" class:ready={gameReady}>
    {#if gameReady}
        <PhaserGame bind:phaserRef />
    {/if}
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
        opacity: 0;
        transition: opacity 0.3s ease-in;
    }

    #app.ready {
        opacity: 1;
    }
</style>
