# Team Dialogue V2 API

## 概述

團隊對話生成 API V2 版本，相較於 V1，每個角色會生成 3 則對話，包括連續性對話和尖銳的心裡話。

## 與 V1 的差異

| 特性           | V1                   | V2                            |
| -------------- | -------------------- | ----------------------------- |
| 每個角色對話數 | 1 則                 | 3 則                          |
| 總對話數       | 16 則                | 48 則                         |
| 對話類型       | 單一發言             | 對話 1 + 對話 2 延續 + 心裡話 |
| 心裡話         | 無                   | 有（更尖銳的真實想法）        |
| API 路徑       | `/api/team-dialogue` | `/api/team-dialogue-v2`       |

## API 端點

### GET `/api/team-dialogue-v2?topic={主題}`

生成基於主題的團隊對話（V2 版本）。

#### 請求參數

-   `topic` (必填): 對話主題，字串類型，不可為空

#### 回應格式

```typescript
{
  "characters": [
    {
      "id": "Cain",
      "name": "Cain",
      "position": "前端工程師Leader",
      "dialogues": [
        "馬的！又要救火了！",              // 對話1
        "而且這次還是 Steven 的大餅...",   // 對話2（延續）
        "又要幫這群豬隊友擦屁股了"         // 心裡話（更尖銳）
      ]
    },
    // ... 其他 15 個角色
  ]
}
```

#### 回應欄位說明

-   `characters`: 角色陣列（固定 16 個）
    -   `id`: 角色 ID
    -   `name`: 角色名稱
    -   `position`: 職位
    -   `dialogues`: 固定 3 則對話的陣列
        -   `[0]`: 第 1 則對話（初始發言，1-150 字）
        -   `[1]`: 第 2 則對話（延續第 1 則，1-150 字）
        -   `[2]`: 心裡話（尖銳的真實想法，1-150 字，純文字無標記）

## 使用範例

### cURL

```bash
curl "https://your-domain.com/api/team-dialogue-v2?topic=新專案延期"
```

### JavaScript (fetch)

```javascript
const response = await fetch("/api/team-dialogue-v2?topic=新專案延期");
const data = await response.json();

// 存取第一個角色的對話
const cain = data.characters.find((c) => c.id === "Cain");
console.log("對話1:", cain.dialogues[0]);
console.log("對話2:", cain.dialogues[1]);
console.log("心裡話:", cain.dialogues[2]);
```

### TypeScript

```typescript
import type { TeamDialogueResponseV2 } from "$lib/types/teamDialogue";

const response = await fetch("/api/team-dialogue-v2?topic=新專案延期");
const data: TeamDialogueResponseV2 = await response.json();

// 計算總對話數
const totalDialogues = data.characters.reduce(
    (sum, char) => sum + char.dialogues.length,
    0
);
console.log("總對話數:", totalDialogues); // 應該是 48
```

## 快取策略

-   **CDN 快取**: 7 天 (`s-maxage=604800`)
-   **Stale-While-Revalidate**: 1 天 (`stale-while-revalidate=86400`)
-   **ETag**: 基於主題生成，格式為 `"v2-{hash}"`

相同主題的請求會在 7 天內直接從 CDN 返回結果，提升效能並降低 AI API 成本。

## 錯誤處理

如果 AI 生成失敗，API 會：

1. 返回 HTTP 200 狀態碼（不中斷服務）
2. 使用原始對話作為 fallback（複製 3 次）
3. 記錄錯誤日誌

## 對話特色

### 對話連續性

-   第 1 則和第 2 則對話有連貫性
-   第 2 則是第 1 則的延續或補充

### 心裡話特色

-   **更尖銳**：比表面對話更犀利
-   **真實想法**：揭露角色的內心獨白
-   **純文字**：無任何標記符號（由前端決定呈現方式）

### 角色風格範例

**Steven（協理）**

-   對話 1: 「這次我有完整的規劃！」
-   對話 2: 「只要團隊配合，三個月內絕對能上線！」
-   心裡話: 「我的想法果然很棒，這次一定會成功的」（完全不自知）

**Anson（副總）**

-   對話 1: 「Steven 的熱情很可貴呢。」
-   對話 2: 「不過我們上次也是這樣說的，對吧？」
-   心裡話: 「這傢伙又要害團隊加班了，真是一點自知之明都沒有」（一刀見血）

**Cain（救火王）**

-   對話 1: 「Steven 又有新想法了？」
-   對話 2: 「行啊，反正最後還是我在熬夜救火」
-   心裡話: 「這群廢物每次都是我在擦屁股，加班費一毛都沒有，幹」（髒話連篇）

## 技術實作

### 檔案結構

```
src/
├── lib/
│   ├── types/
│   │   └── teamDialogue.ts          # 包含 V2 類型定義
│   └── teamDialogueUtils.ts         # 包含 generateTeamDialogueV2()
└── routes/
    └── api/
        └── team-dialogue-v2/
            ├── +server.ts            # V2 API 端點
            ├── api-v2.test.ts        # 單元測試
            └── README.md             # 本文件
```

### 相關函式

-   `generateTeamDialogueV2()`: 使用 Gemini AI 生成 V2 對話
-   `createTeamDialogueV2Prompt()`: 建立 V2 專用的 AI prompt
-   `parseGeminiV2JsonResponse()`: 解析 AI 回應的 JSON

## 向下相容性

V1 API (`/api/team-dialogue`) 保持完全運作，不受 V2 影響。兩個版本可以同時使用。

## 注意事項

1. **回應較大**: V2 回應內容是 V1 的 3 倍，請注意網路傳輸
2. **AI 成本**: 生成 48 則對話比 16 則對話消耗更多 AI tokens
3. **處理時間**: V2 可能需要更長的處理時間
4. **快取重要性**: 建議充分利用 7 天 CDN 快取來降低成本

## 版本資訊

-   **版本**: 2.0.0
-   **建立日期**: 2025-10-10
-   **相依**: Gemini AI API, SvelteKit, TypeScript
