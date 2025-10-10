# Team Dialogue API 文件

## 端點資訊

-   **URL**: `/api/team-dialogue?topic={主題}`
-   **方法**: `GET`
-   **緩存機制**: Vercel CDN 緩存 7 天

## 功能說明

輸入一個主題，使用 AI 生成符合角色個性的職場諷刺風格團隊對話。對話風格為重度黑色幽默，主要批評協理 Steven。

**✨ 緩存優勢**: 使用 GET 方法可充分利用 Vercel CDN 緩存，相同主題的請求會直接從 CDN 返回，不同用戶查詢相同主題時速度極快（~50-200ms），且不消耗 AI token。

## 請求格式

### Query Parameters

| 參數  | 類型   | 必填 | 說明                                                 |
| ----- | ------ | ---- | ---------------------------------------------------- |
| topic | string | 是   | 對話主題，例如「新的項目進來了，下個月前一定要完成」 |

### URL 編碼

主題文字需要進行 URL 編碼（URL encoding）：

-   **原始**: `新的項目進來了，下個月前一定要完成`
-   **編碼**: `%E6%96%B0%E7%9A%84%E9%A0%85%E7%9B%AE%E9%80%B2%E4%BE%86%E4%BA%86%EF%BC%8C%E4%B8%8B%E5%80%8B%E6%9C%88%E5%89%8D%E4%B8%80%E5%AE%9A%E8%A6%81%E5%AE%8C%E6%88%90`

## 回應格式

### 成功回應 (200 OK)

```json
{
    "characters": [
        {
            "id": "Kevin",
            "name": "Kevin",
            "position": "軟體開發PM",
            "dialogue": "Steven，上次您說的『無限潛力』，最後是讓我們無限加班..."
        },
        {
            "id": "Steven",
            "name": "Steven",
            "position": "協理",
            "dialogue": "各位，這次的全新項目，我已經和高層完美溝通..."
        }
        // ... 其他 13 個角色
    ]
}
```

### 錯誤回應 (400 Bad Request)

```json
{
    "error": "Topic is required and must be a non-empty string"
}
```

## 使用範例

### cURL

```bash
# 本地開發環境
curl "http://localhost:5173/api/team-dialogue?topic=新的項目進來了，下個月前一定要完成"

# 或使用 URL 編碼
curl "http://localhost:5173/api/team-dialogue?topic=%E6%96%B0%E7%9A%84%E9%A0%85%E7%9B%AE%E9%80%B2%E4%BE%86%E4%BA%86"
```

### JavaScript (fetch)

```javascript
// 瀏覽器會自動處理 URL 編碼
const topic = "新的項目進來了，下個月前一定要完成";
const response = await fetch(
    `/api/team-dialogue?topic=${encodeURIComponent(topic)}`
);

const data = await response.json();
console.log(data.characters);
```

### JavaScript (使用 URLSearchParams)

```javascript
const params = new URLSearchParams({
    topic: "新的項目進來了，下個月前一定要完成",
});

const response = await fetch(`/api/team-dialogue?${params}`);
const data = await response.json();
console.log(data.characters);
```

### Python (requests)

```python
import requests
from urllib.parse import quote

topic = '新的項目進來了，下個月前一定要完成'
response = requests.get(
    f'http://localhost:5173/api/team-dialogue',
    params={'topic': topic}  # requests 會自動處理 URL 編碼
)

data = response.json()
print(data['characters'])
```

## 角色列表

API 會為以下 15 個角色生成對話：

| ID         | 姓名       | 職位              | 個性                  |
| ---------- | ---------- | ----------------- | --------------------- |
| Kevin      | Kevin      | 軟體開發 PM       | 年輕氣盛              |
| Johnny     | Johnny     | 3D 模型設計師     | 專業熱心              |
| Vasiliy    | Vasiliy    | 後端開發工程師    | 任性愛抱怨            |
| Charles    | Charles    | 後端開發工程師    | 循規蹈矩的溫和個性    |
| Edward     | 阿隆       | 3D 模型設計師     | 不苟言的獨行俠        |
| Denny      | Denny      | 後端工程師 Leader | 條理清晰規範大師      |
| Cain       | Cain       | 前端工程師 Leader | 技術逆天專案救火王    |
| Jacky      | Jacky      | PM Leader         | 人際良好              |
| **Steven** | **Steven** | **協理**          | **愛說夢的吹牛王** ⭐ |
| Max        | Max        | 軟體開發 PM       | 細心周到              |
| Sylvia     | Sylvia     | UIUX 設計師       | 能力不足油條大王      |
| Kexy       | Kexy       | 前端開發工程師    | 害羞內向              |
| Dennis     | Dennis     | 前端開發工程師    | 馬來西亞好好先生      |
| Tom        | Tom        | Unity 工程師      | 按部就班不喜歡變化    |
| Jeff       | Jeff       | MIS               | 高級背鍋王            |

⭐ **Steven（協理）是主要被批評的對象**

## 對話風格特點

-   **重度黑色幽默**：充滿職場諷刺與無奈
-   **批評 Steven**：大部分角色會直接或間接吐槽協理的不切實際
-   **角色個性鮮明**：
    -   Cain、Denny：直接開砲
    -   Kexy、Charles：委婉諷刺
    -   Jeff：無奈接受
    -   Sylvia：冷眼旁觀
    -   Steven：自我感覺良好、完全不自知
-   **有互動性**：角色間會提到彼此的名字
-   **對話長度**：每人一句話，1-300 字

## 主題建議

適合的對話主題範例：

-   `"新的項目進來了，下個月前一定要完成"`
-   `"客戶又要改需求了"`
-   `"年終考核要到了"`
-   `"預算被砍了一半，但功能不能少"`
-   `"這個功能很簡單，應該一天就能做完"`
-   `"我們要追上競爭對手的所有功能"`

## 技術細節

-   **AI 模型**：Google Gemini 2.5 Flash
-   **回應時間**：
    -   首次請求（未緩存）：20-30 秒（需生成 15 個角色的對話）
    -   緩存命中：50-200ms（從 Vercel CDN 返回）
-   **緩存策略**：
    -   CDN 緩存時間：7 天（`s-maxage=604800`）
    -   過期策略：`stale-while-revalidate`，過期後 24 小時內先返回舊資料，背景更新
    -   ETag 支援：客戶端可使用 `If-None-Match` 進行驗證
-   **錯誤處理**：AI 生成失敗時會回退到原始範例對話
-   **日誌記錄**：完整的結構化日誌追蹤

## 緩存機制說明

### 為什麼使用 GET？

相較於 POST 請求，GET 請求有以下優勢：

1. **CDN 友善**：Vercel CDN 可以完整緩存 GET 請求
2. **跨用戶共享**：不同用戶查詢相同主題時，會直接從 CDN 返回結果
3. **成本節省**：減少 Serverless Function 執行次數和 AI API 呼叫
4. **速度極快**：緩存命中時回應時間降低到 50-200ms

### 緩存流程

```
第一個用戶請求 "開會遲到"
└─> Vercel Edge → API → Gemini AI (20秒)
    └─> 結果緩存 7 天

第二個用戶請求 "開會遲到" (7天內)
└─> Vercel Edge (緩存命中) ✅ (50ms)
    └─> 直接返回，不呼叫 API
```

## 注意事項

1. **回應時間**：首次請求需要 AI 生成，約 20-30 秒；相同主題的後續請求從緩存返回，極快
2. **主題長度**：建議主題長度在 10-100 字之間，過長可能影響生成品質
3. **語言**：主題請使用繁體中文，以獲得最佳效果
4. **Fallback 機制**：如果 AI 生成失敗，會返回預設的範例對話（HTTP 200）
5. **URL 編碼**：主題包含中文或特殊字元時，需要進行 URL 編碼（大多數 HTTP 客戶端會自動處理）

## 開發環境測試

```bash
# 啟動開發伺服器
pnpm dev

# 測試 API
curl "http://localhost:5173/api/team-dialogue?topic=又要熬夜加班了"

# 測試緩存（第二次請求相同主題應該更快）
curl "http://localhost:5173/api/team-dialogue?topic=又要熬夜加班了" -w "\nTime: %{time_total}s\n"
```

## 生產環境

部署到 Vercel 後，API 端點為：

```
GET https://line-boot.vercel.app/api/team-dialogue?topic={主題}
```

### 生產環境測試範例

```bash
# 基本請求
curl "https://line-boot.vercel.app/api/team-dialogue?topic=新的項目進來了"

# 查看完整 headers（包含 Cache-Control, ETag）
curl -i "https://line-boot.vercel.app/api/team-dialogue?topic=新的項目進來了"

# 測試緩存效果
curl "https://line-boot.vercel.app/api/team-dialogue?topic=新的項目進來了" \
  -w "\nTime: %{time_total}s\n"
```

### 預期行為

**首次請求（未緩存）**：

```
Time: ~20-30s
Headers 包含:
- ETag: "xxxxx"
- Cache-Control: public, s-maxage=604800, stale-while-revalidate=86400
```

**後續請求（緩存命中，7 天內）**：

```
Time: ~0.05-0.2s  ⚡️ 快 100 倍！
相同的 ETag 和 Cache-Control headers
```
