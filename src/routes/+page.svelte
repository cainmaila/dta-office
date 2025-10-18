<script lang="ts">
    import type { Scene } from "phaser";
    import PhaserGame, { type TPhaserRef } from "../PhaserGame.svelte";
    import SplashScreen from "../components/SplashScreen.svelte";
    import { EventBus } from "../game/EventBus";
    import {
        fetchTeamDialogue,
        fetchTeamDialogueList,
        type DialogueCharacter,
    } from "../lib/api/teamDialogue";
    import { SoundManager } from "../game/utils/SoundManager";

    type ApiStatus = "idle" | "loading" | "success" | "error";

    //  References to the PhaserGame component (game and scene are exposed)
    let phaserRef = $state<TPhaserRef>({ game: null, scene: null });
    let initialDialogueData = $state<{
        characters: DialogueCharacter[] | null;
        topic?: string;
    } | null>(null);
    let showSplash = $state(true);
    let gameReady = $state(false);
    let phaserLoaded = $state(false);
    let apiStatus = $state<ApiStatus>("idle");
    let apiError = $state<Error | null>(null);
    let loadingMessage = $state<string | null>(null);

    // 使用 $derived 來計算當前遊戲狀態，簡化邏輯
    let gameState = $derived.by(() => {
        if (apiStatus === "success" && initialDialogueData) {
            return { type: "ready" as const, data: initialDialogueData };
        } else if (apiStatus === "error") {
            return {
                type: "error" as const,
                error: apiError?.message || "提案失敗",
            };
        } else if (apiStatus === "loading") {
            return { type: "loading" as const };
        } else {
            return { type: "idle" as const };
        }
    });

    let splashAnimationComplete = $state(false);

    function handleSplashComplete() {
        splashAnimationComplete = true;
        // 只有在 Phaser 也載入完成時才真正結束
        checkReadyToShow();
    }

    function checkReadyToShow() {
        if (splashAnimationComplete && phaserLoaded) {
            showSplash = false;
            gameReady = true;

            // 根據 gameState 決定下一步
            switch (gameState.type) {
                case "ready":
                    EventBus.emit("set-custom-dialogue", gameState.data);
                    break;
                case "error":
                    EventBus.emit("set-custom-dialogue-error", {
                        error: gameState.error,
                    });
                    break;
                case "loading":
                    EventBus.emit("set-custom-dialogue-pending");
                    break;
                case "idle":
                    EventBus.emit("set-custom-dialogue", { characters: null });
                    break;
            }
        }
    }

    // 使用 $effect 處理組件掛載時的邏輯
    $effect(() => {
        // 監聽 Phaser 場景準備完成
        const handleSceneReady = () => {
            phaserLoaded = true;
            checkReadyToShow();
        };
        EventBus.on("current-scene-ready", handleSceneReady);

        // 開場載入 - 取得歷史主題列表
        fetchTeamDialogueList()
            .then((response) => {
                console.log("🎯 Team Dialogue List 載入成功:", response);
            })
            .catch((error) => {
                console.error("❌ Team Dialogue List 載入失敗:", error);
            });

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
                    if (gameReady && gameState.type === "ready") {
                        EventBus.emit("set-custom-dialogue", gameState.data);
                    }
                })
                .catch((error) => {
                    // API 失敗
                    console.error("載入主題對話失敗:", error);
                    apiStatus = "error";
                    apiError = error;
                    loadingMessage = null;

                    // 如果遊戲已經準備好，立即通知錯誤
                    if (gameReady && gameState.type === "error") {
                        EventBus.emit("set-custom-dialogue-error", {
                            error: gameState.error,
                        });
                    }
                });
        }

        // 清理函數：清理事件監聽器，防止記憶體洩漏
        return () => {
            EventBus.off("current-scene-ready", handleSceneReady);
            EventBus.off("set-custom-dialogue");
            EventBus.off("set-custom-dialogue-error");
            EventBus.off("set-custom-dialogue-pending");
        };
    });
</script>

{#if showSplash}
    <SplashScreen onComplete={handleSplashComplete} {loadingMessage} />
{/if}

<div id="app" class:ready={gameReady}>
    <!-- PhaserGame 一開始就載入，但透過 opacity 隱藏 -->
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
        opacity: 0;
        transition: opacity 0.3s ease-in;
    }

    #app.ready {
        opacity: 1;
    }
</style>
