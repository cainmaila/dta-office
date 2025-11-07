import { Scene } from "phaser";
import {
    createTeamDialogue,
    fetchTeamDialogue,
    fetchTeamDialogueList,
    type DialogueCharacter,
} from "../../lib/api/teamDialogue";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { TopicInputUI } from "../ui/TopicInputUI";
import { TopicTitleUI } from "../ui/TopicTitleUI";
import { ControlButtons } from "../ui/ControlButtons";
import { TopicListUI } from "../ui/TopicListUI";
import type { CharactersData } from "../types/NPCTypes";
import { SoundManager } from "../utils/SoundManager";

/**
 * 主題對話管理器
 * 負責處理主題輸入、API 呼叫、對話更新
 */
export class TopicDialogueManager {
    private scene: Scene;
    private loadingOverlay: LoadingOverlay;
    private topicInputUI: TopicInputUI;
    private topicTitleUI: TopicTitleUI;
    private controlButtons: ControlButtons;
    private topicListUI: TopicListUI;
    private currentTopic: string = "";
    private originalCharacters: DialogueCharacter[] = [];

    constructor(scene: Scene) {
        this.scene = scene;

        // 建立 UI 元件
        this.loadingOverlay = new LoadingOverlay(scene);
        this.topicInputUI = new TopicInputUI(scene);
        this.topicTitleUI = new TopicTitleUI(scene);
        this.controlButtons = new ControlButtons(scene);
        this.topicListUI = new TopicListUI(scene);

        // 設定事件
        this.setupEvents();
    }

    /**
     * 設定事件監聽
     */
    private setupEvents(): void {
        // 主題輸入送出
        this.topicInputUI.onSubmit(async (topic: string, story?: string) => {
            await this.handleTopicSubmit(topic, story);
        });

        // 重新輸入按鈕（切換輸入框顯示/隱藏）
        this.controlButtons.onRetry(() => {
            this.topicInputUI.toggle();
        });

        // 過去議題按鈕
        this.controlButtons.onPastTopics(() => {
            // 切換顯示/隱藏議題列表
            if (this.topicListUI.isVisible()) {
                this.topicListUI.hide();
            } else {
                this.loadAndShowPastTopics();
            }
        });

        // 議題選擇（使用 GET 載入）
        this.topicListUI.onTopicSelect(async (topic: string) => {
            this.topicListUI.hide();
            await this.handleTopicLoad(topic);
        });
    }

    /**
     * 處理主題送出（表單創建，使用 POST）
     */
    private async handleTopicSubmit(topic: string, story?: string): Promise<void> {
        this.topicInputUI.hide();
        this.loadingOverlay.showLoading("需求討論中..");

        try {
            const response = await createTeamDialogue(topic, story, 60000);

            // 播放 API 回應音效
            SoundManager.playSound("/sound/quiz-start.mp3", 0.5);

            // 更新對話
            this.updateCharactersDialogue(response.characters);

            // 更新當前主題
            this.currentTopic = topic;
            this.controlButtons.setCurrentTopic(topic);
            this.topicTitleUI.setTopic(topic);

            // 更新 URL
            this.updateUrlWithTopic(topic);

            this.loadingOverlay.hide();
        } catch (error) {
            console.error("API 呼叫失敗:", error);
            this.loadingOverlay.showError("提案失敗", 2000);
            // 不再自動顯示輸入框，由「重新討論」按鈕控制
        }
    }

    /**
     * 處理主題載入（歷史記錄，使用 GET）
     */
    private async handleTopicLoad(topic: string): Promise<void> {
        this.loadingOverlay.showLoading("需求討論中..");

        try {
            const response = await fetchTeamDialogue(topic, 60000);

            // 播放 API 回應音效
            SoundManager.playSound("/sound/quiz-start.mp3", 0.5);

            // 更新對話
            this.updateCharactersDialogue(response.characters);

            // 更新當前主題
            this.currentTopic = topic;
            this.controlButtons.setCurrentTopic(topic);
            this.topicTitleUI.setTopic(topic);

            // 更新 URL
            this.updateUrlWithTopic(topic);

            this.loadingOverlay.hide();
        } catch (error) {
            console.error("API 呼叫失敗:", error);
            this.loadingOverlay.showError("載入失敗", 2000);
        }
    }

    /**
     * 更新角色對話
     */
    private updateCharactersDialogue(newCharacters: DialogueCharacter[]): void {
        // 發送事件通知場景更新對話
        this.scene.events.emit("update-characters-dialogue", newCharacters);
    }

    /**
     * 更新 URL 參數
     */
    private updateUrlWithTopic(topic: string): void {
        const url = new URL(window.location.href);
        url.searchParams.set("topic", topic);
        window.history.pushState({}, "", url.toString());
    }

    /**
     * 顯示主題輸入框
     */
    showTopicInput(): void {
        this.topicInputUI.show();
        this.topicTitleUI.hide();
    }

    /**
     * 隱藏主題輸入框
     */
    hideTopicInput(): void {
        this.topicInputUI.hide();
    }

    /**
     * 載入主題對話（從 URL 或外部呼叫，使用 GET）
     */
    async loadTopicDialogue(
        topic: string
    ): Promise<DialogueCharacter[] | null> {
        this.loadingOverlay.showLoading("需求討論中..");

        try {
            const response = await fetchTeamDialogue(topic, 60000);

            // 播放 API 回應音效
            SoundManager.playSound("/sound/quiz-start.mp3", 0.5);

            this.currentTopic = topic;
            this.controlButtons.setCurrentTopic(topic);

            this.loadingOverlay.hide();

            return response.characters;
        } catch (error) {
            console.error("API 呼叫失敗:", error);
            this.loadingOverlay.showError("提案失敗", 2000);
            // 不再自動顯示輸入框，由「重新討論」按鈕控制
            return null;
        }
    }

    /**
     * 設定當前主題（用於從外部設定）
     */
    setCurrentTopic(topic: string): void {
        this.currentTopic = topic;
        this.controlButtons.setCurrentTopic(topic);
        this.topicTitleUI.setTopic(topic);
    }

    /**
     * 儲存原始角色資料
     */
    setOriginalCharacters(characters: DialogueCharacter[]): void {
        this.originalCharacters = characters;
    }

    /**
     * 顯示 Loading 覆蓋層（公開方法，供外部呼叫）
     */
    showLoadingOverlay(message: string = "需求討論中.."): void {
        this.loadingOverlay.showLoading(message);
    }

    /**
     * 隱藏 Loading 覆蓋層（公開方法，供外部呼叫）
     */
    hideLoadingOverlay(): void {
        this.loadingOverlay.hide();
    }

    /**
     * 顯示錯誤覆蓋層（公開方法，供外部呼叫）
     */
    showErrorOverlay(
        message: string = "提案失敗",
        duration: number = 2000
    ): void {
        this.loadingOverlay.showError(message, duration);
    }

    /**
     * 載入並顯示過去議題
     */
    private async loadAndShowPastTopics(): Promise<void> {
        try {
            const response = await fetchTeamDialogueList(10000);
            this.topicListUI.updateTopics(response.topics);
            this.topicListUI.show();
        } catch (error) {
            console.error("載入議題列表失敗:", error);
            this.loadingOverlay.showError("無法載入過去議題", 2000);
        }
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.loadingOverlay.destroy();
        this.topicInputUI.destroy();
        this.topicTitleUI.destroy();
        this.controlButtons.destroy();
        this.topicListUI.destroy();
    }
}
