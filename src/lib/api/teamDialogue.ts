/**
 * Team Dialogue API Client
 * 呼叫後端 API 生成主題對話（每個角色 3 則對話）
 */

export interface DialogueCharacter {
    id: string;
    name: string;
    position: string;
    dialogues: [string, string, string]; // 固定 3 則對話
}

export interface TeamDialogueResponse {
    characters: DialogueCharacter[];
}

export interface TeamDialogueError {
    error: string;
}

export interface TopicItem {
    hash: string;
    topic: string;
    timestamp: number;
}

export interface TeamDialogueListResponse {
    topics: TopicItem[];
    total: number;
}

// 統一使用生產環境 API（已部署）
const API_ENDPOINT = "https://line-boot.vercel.app/api/team-dialogue-v2";
const API_LIST_ENDPOINT = "https://line-boot-git-main-cain-chu.vercel.app/api/team-dialogue-list";

/**
 * 取得當前環境的 API endpoint
 */
function getApiEndpoint(): string {
    return API_ENDPOINT;
}

/**
 * 呼叫 Team Dialogue API
 * @param topic 對話主題
 * @param timeoutMs 超時時間（毫秒），預設 60000ms (60秒)
 * @returns Promise<TeamDialogueResponse>
 * @throws Error 當 API 失敗或超時
 */
export async function fetchTeamDialogue(
    topic: string,
    timeoutMs: number = 60000
): Promise<TeamDialogueResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // 使用 URLSearchParams 進行 URL 編碼
        const params = new URLSearchParams({ topic });
        const url = `${getApiEndpoint()}?${params}`;

        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData: TeamDialogueError = await response.json();
            throw new Error(errorData.error || `API 錯誤: ${response.status}`);
        }

        const data: TeamDialogueResponse = await response.json();
        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === "AbortError") {
                throw new Error("請求超時");
            }
            throw error;
        }

        throw new Error("未知錯誤");
    }
}

/**
 * 呼叫 Team Dialogue List API 取得歷史主題列表
 * @param timeoutMs 超時時間（毫秒），預設 10000ms (10秒)
 * @returns Promise<TeamDialogueListResponse>
 * @throws Error 當 API 失敗或超時
 */
export async function fetchTeamDialogueList(
    timeoutMs: number = 10000
): Promise<TeamDialogueListResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(API_LIST_ENDPOINT, {
            method: "GET",
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData: TeamDialogueError = await response.json();
            throw new Error(errorData.error || `API 錯誤: ${response.status}`);
        }

        const data: TeamDialogueListResponse = await response.json();
        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === "AbortError") {
                throw new Error("請求超時");
            }
            throw error;
        }

        throw new Error("未知錯誤");
    }
}
