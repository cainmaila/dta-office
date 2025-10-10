import { Scene } from "phaser";
import { fetchTeamDialogue, type Character } from "../../lib/api/teamDialogue";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { TopicInputUI } from "../ui/TopicInputUI";
import { TopicTitleUI } from "../ui/TopicTitleUI";
import { ControlButtons } from "../ui/ControlButtons";
import type { CharactersData } from "../types/NPCTypes";

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
    private currentTopic: string = "";
    private originalCharacters: Character[] = [];

    constructor(scene: Scene) {
        this.scene = scene;

        // 建立 UI 元件
        this.loadingOverlay = new LoadingOverlay(scene);
        this.topicInputUI = new TopicInputUI(scene);
        this.topicTitleUI = new TopicTitleUI(scene);
        this.controlButtons = new ControlButtons(scene);

        // 設定事件
        this.setupEvents();
    }

    /**
     * 設定事件監聽
     */
    private setupEvents(): void {
        // 主題輸入送出
        this.topicInputUI.onSubmit(async (topic: string) => {
            await this.handleTopicSubmit(topic);
        });

        // 重新輸入按鈕
        this.controlButtons.onRetry(() => {
            this.showTopicInput();
        });
    }

    /**
     * 處理主題送出
     */
    private async handleTopicSubmit(topic: string): Promise<void> {
        this.topicInputUI.hide();
        this.loadingOverlay.showLoading("需求討論中..");

        try {
            const response = await fetchTeamDialogue(topic, 60000);

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

            // 2 秒後重新顯示輸入框
            this.scene.time.delayedCall(2000, () => {
                this.showTopicInput();
            });
        }
    }

    /**
     * 更新角色對話
     */
    private updateCharactersDialogue(newCharacters: Character[]): void {
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
     * 載入主題對話（從 URL 或外部呼叫）
     */
    async loadTopicDialogue(topic: string): Promise<Character[] | null> {
        this.loadingOverlay.showLoading("需求討論中..");

        try {
            const response = await fetchTeamDialogue(topic, 60000);

            this.currentTopic = topic;
            this.controlButtons.setCurrentTopic(topic);

            this.loadingOverlay.hide();

            return response.characters;
        } catch (error) {
            console.error("API 呼叫失敗:", error);
            this.loadingOverlay.showError("提案失敗", 2000);

            // 失敗後顯示輸入框
            this.scene.time.delayedCall(2000, () => {
                this.showTopicInput();
            });

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
    setOriginalCharacters(characters: Character[]): void {
        this.originalCharacters = characters;
    }

    /**
     * 銷毀
     */
    destroy(): void {
        this.loadingOverlay.destroy();
        this.topicInputUI.destroy();
        this.topicTitleUI.destroy();
        this.controlButtons.destroy();
    }
}
