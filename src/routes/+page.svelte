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

    type ApiStatus = "idle" | "loading" | "success" | "error";

    //  References to the PhaserGame component (game and scene are exposed)
    let phaserRef: TPhaserRef = { game: null, scene: null };
    let initialDialogueData: {
        characters: DialogueCharacter[] | null;
        topic?: string;
    } | null = null;
    let showSplash = true;
    let gameReady = false;
    let apiStatus: ApiStatus = "idle";
    let apiError: Error | null = null;
    let loadingMessage: string | null = null;

    function handleSplashComplete() {
        showSplash = false;
        gameReady = true;

        // SplashScreen 完成後，根據 API 狀態決定下一步
        EventBus.once("current-scene-ready", () => {
            if (apiStatus === "success" && initialDialogueData) {
                // API 已成功，直接設定對話
                EventBus.emit("set-custom-dialogue", initialDialogueData);
            } else if (apiStatus === "error") {
                // API 失敗，通知遊戲顯示錯誤並顯示輸入框
                EventBus.emit("set-custom-dialogue-error", {
                    error: apiError?.message || "提案失敗",
                });
            } else if (apiStatus === "loading") {
                // API 還在進行中，通知遊戲繼續等待
                EventBus.emit("set-custom-dialogue-pending");
            } else {
                // 沒有 API 呼叫（無 query），顯示輸入框
                EventBus.emit("set-custom-dialogue", { characters: null });
            }
        });
    }

    onMount(async () => {
        // 檢查 URL query 參數
        const urlParams = new URLSearchParams(window.location.search);
        const topic = urlParams.get("topic");

        if (topic) {
            // 有主題，開始 API 呼叫（不等待，背景執行）
            apiStatus = "loading";
            loadingMessage = "需求討論中..";

            fetchTeamDialogue(topic, 60000)
                .then((response) => {
                    // API 成功
                    apiStatus = "success";
                    loadingMessage = null;

                    // 播放 API 回應音效
                    SoundManager.playSound("/sound/quiz-start.mp3", 0.5);

                    initialDialogueData = {
                        characters: response.characters,
                        topic: topic,
                    };

                    // 如果遊戲已經準備好，立即發送資料
                    if (gameReady) {
                        EventBus.emit("set-custom-dialogue", initialDialogueData);
                    }
                })
                .catch((error) => {
                    // API 失敗
                    console.error("載入主題對話失敗:", error);
                    apiStatus = "error";
                    apiError = error;
                    loadingMessage = null;

                    // 如果遊戲已經準備好，立即通知錯誤
                    if (gameReady) {
                        EventBus.emit("set-custom-dialogue-error", {
                            error: error.message || "提案失敗",
                        });
                    }
                });
        }
    });
</script>

{#if showSplash}
    <SplashScreen onComplete={handleSplashComplete} {loadingMessage} />
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
