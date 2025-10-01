# NPC 樣式系統開發文件

## 📋 概述

基於 `npc.png` 精靈圖集開發的完整 NPC 樣式切換系統，支援多種角色造型和動作狀態。

## 🎨 素材分析

### npc.png 結構

-   **圖集類型**: Sprite Sheet (精靈圖集)
-   **網格尺寸**: 13 列 × 11 行 = 143 幀
-   **每幀尺寸**: 78 × 93 像素
-   **圖集總尺寸**: 1024 × 1024 像素

### 角色類型

| 樣式 ID             | 名稱       | 描述                   | 適合職位                       | 預設幀 |
| ------------------- | ---------- | ---------------------- | ------------------------------ | ------ |
| `business_male_1`   | 商務男性 1 | 穿著正式西裝的男性角色 | 經理、主管、客戶、總監         | 0      |
| `business_female_1` | 商務女性 1 | 穿著正式套裝的女性角色 | 經理、設計師、專員、主管       | 3      |
| `casual_male_1`     | 休閒男性 1 | 穿著休閒服裝的男性角色 | 工程師、實習生、技術員、開發者 | 6      |
| `casual_female_1`   | 休閒女性 1 | 穿著休閒服裝的女性角色 | 設計師、助理、專員、行政       | 9      |

### 動作狀態與幀索引

每種角色類型包含 4 種動作狀態：

#### business_male_1 (商務男性)

-   **idle** (站立): [0, 1, 2]
-   **walking** (行走): [13, 14, 15, 16]
-   **sitting** (坐著): [26, 27]
-   **talking** (說話): [39, 40, 41]

#### business_female_1 (商務女性)

-   **idle** (站立): [3, 4, 5]
-   **walking** (行走): [17, 18, 19, 20]
-   **sitting** (坐著): [28, 29]
-   **talking** (說話): [42, 43, 44]

#### casual_male_1 (休閒男性)

-   **idle** (站立): [6, 7, 8]
-   **walking** (行走): [21, 22, 23, 24]
-   **sitting** (坐著): [30, 31]
-   **talking** (說話): [45, 46, 47]

#### casual_female_1 (休閒女性)

-   **idle** (站立): [9, 10, 11]
-   **walking** (行走): [25, 26, 27, 28]
-   **sitting** (坐著): [32, 33]
-   **talking** (說話): [48, 49, 50]

## 🏗️ 系統架構

### 核心檔案

1. **`src/game/data/npcStyles.ts`**

    - 樣式定義和配置
    - 提供樣式查詢函數
    - 幀索引計算工具

2. **`src/game/types/NPCTypes.ts`**

    - 更新 `NPCData` 介面，新增 `styleId` 和 `action` 欄位

3. **`src/game/objects/NPC.ts`**

    - NPC 類別，新增樣式切換方法
    - 支援動作切換和動畫播放

4. **`src/game/managers/NPCManager.ts`**

    - NPC 管理器，提供批次樣式管理

5. **`static/assets/data/npcs.json`**
    - NPC 資料配置，使用新的樣式系統

## 🔧 使用方法

### 1. 在 JSON 中配置 NPC 樣式

```json
{
    "id": "npc_001",
    "name": "李經理",
    "position": "產品經理",
    "x": 300,
    "y": 400,
    "styleId": "business_male_1",
    "action": "idle",
    "dialogue": "歡迎！",
    "npcType": "standing"
}
```

### 2. 程式碼中切換樣式

```typescript
// 方法 1: 透過 NPCManager
npcManager.setNPCStyle("npc_001", "casual_male_1", "idle");

// 方法 2: 直接操作 NPC 物件
const npc = npcManager.getNPC("npc_001");
npc.setStyle("business_female_1", "talking");
```

### 3. 切換動作狀態

```typescript
// 切換到坐著狀態
npcManager.setNPCAction("npc_001", "sitting");

// 切換到走路狀態
npc.setAction("walking");
```

### 4. 播放動作動畫

```typescript
// 播放說話動畫（循環播放）
npcManager.playNPCAnimation("npc_001", "talking", 300);

// 播放走路動畫
npc.playActionAnimation("walking", 200);
```

### 5. 查詢樣式資訊

```typescript
import {
    getAllStyles,
    getRecommendedStyles,
    getStyleById,
} from "../data/npcStyles";

// 獲取所有樣式
const allStyles = getAllStyles();

// 根據職位推薦樣式
const styles = getRecommendedStyles("經理");

// 獲取特定樣式
const style = getStyleById("business_male_1");
```

## 🎮 互動示範

### 在 Game Scene 中添加樣式選擇器

```typescript
// 在 Game.ts 的 create() 方法中
const switchButton = this.add
    .text(50, 50, "切換造型", {
        fontSize: "20px",
        backgroundColor: "#4CAF50",
        padding: { x: 15, y: 10 },
    })
    .setInteractive();

const styles = getAllStyles();
let currentIndex = 0;

switchButton.on("pointerdown", () => {
    currentIndex = (currentIndex + 1) % styles.length;
    this.npcManager.setNPCStyle("npc_001", styles[currentIndex].id, "idle");
});
```

## 📊 API 參考

### NPC 類別方法

#### `setStyle(styleId: string, action?: string): this`

切換 NPC 樣式

-   **參數**:
    -   `styleId`: 樣式 ID
    -   `action`: 動作狀態 (預設為 'idle')
-   **返回**: NPC 實例（支援鏈式調用）

#### `setAction(action: string, frameIndex?: number): this`

切換動作狀態

-   **參數**:
    -   `action`: 動作狀態 ('idle', 'walking', 'sitting', 'talking')
    -   `frameIndex`: 幀索引 (可選)
-   **返回**: NPC 實例

#### `playActionAnimation(action: string, duration?: number): this`

播放動作動畫

-   **參數**:
    -   `action`: 動作狀態
    -   `duration`: 每幀持續時間（毫秒，預設 200）
-   **返回**: NPC 實例

#### `getCurrentStyle(): NPCStyle | undefined`

獲取當前樣式資訊

#### `getCurrentAction(): string`

獲取當前動作狀態

### NPCManager 方法

#### `setNPCStyle(id: string, styleId: string, action?: string): void`

切換指定 NPC 的樣式

#### `setNPCAction(id: string, action: string): void`

切換指定 NPC 的動作

#### `playNPCAnimation(id: string, action: string, duration?: number): void`

播放指定 NPC 的動畫

### 工具函數 (npcStyles.ts)

#### `getAllStyles(): NPCStyle[]`

獲取所有可用樣式

#### `getStyleById(styleId: string): NPCStyle | undefined`

根據 ID 獲取樣式

#### `getRecommendedStyles(position: string): NPCStyle[]`

根據職位推薦樣式

#### `getFrameForAction(styleId: string, action: string, frameIndex?: number): number`

獲取指定樣式和動作的幀索引

## 🎯 使用案例

### 案例 1: 會議場景

讓所有 NPC 切換到 sitting (坐著) 狀態

```typescript
["npc_001", "npc_002", "npc_003"].forEach((id) => {
    npcManager.setNPCAction(id, "sitting");
});
```

### 案例 2: 簡報場景

讓講者播放 talking 動畫，其他人保持 idle

```typescript
npcManager.playNPCAnimation("npc_001", "talking", 300);
["npc_002", "npc_003"].forEach((id) => {
    npcManager.setNPCAction(id, "idle");
});
```

### 案例 3: 動態職位變更

當 NPC 升職時，自動切換到合適的樣式

```typescript
function promoteNPC(npcId: string, newPosition: string) {
    const recommendedStyles = getRecommendedStyles(newPosition);
    if (recommendedStyles.length > 0) {
        npcManager.setNPCStyle(npcId, recommendedStyles[0].id, "idle");
    }
}

promoteNPC("npc_001", "總監"); // 自動推薦商務套裝
```

## 🔄 遷移指南

### 從舊系統遷移

**舊格式 (npcs.json):**

```json
{
    "sprite": "npc-a",
    "frameIndex": 3
}
```

**新格式:**

```json
{
    "styleId": "business_female_1",
    "action": "idle"
}
```

系統向後兼容，如果 `styleId` 不存在，會使用 `frameIndex` 作為備用。

## 📈 未來擴展

### 可能的增強功能

1. **更多樣式**: 添加更多角色造型（需要設計新的精靈圖）
2. **自定義動畫**: 支援自定義幀序列
3. **動畫混合**: 支援動作之間的平滑過渡
4. **方向支援**: 添加 4 方向或 8 方向的角色朝向
5. **服裝系統**: 支援配件和服裝組合

## 🐛 故障排除

### 問題: NPC 不顯示或顯示錯誤幀

**解決方案:**

1. 確認 `npc.png` 已正確載入
2. 檢查 `styleId` 是否有效
3. 確認幀索引是否在 0-142 範圍內

```typescript
// 調試用
const npc = npcManager.getNPC("npc_001");
console.log("Current style:", npc.getCurrentStyle());
console.log("Current action:", npc.getCurrentAction());
console.log("Current frame:", npc.frame.name);
```

### 問題: 動畫不播放

**解決方案:**
確認該樣式的動作有多個幀

```typescript
const style = getStyleById("business_male_1");
console.log("Talking frames:", style.frames.talking); // 應該有多個幀
```

## 📝 總結

這個 NPC 樣式系統提供了：

-   ✅ 4 種基本角色造型
-   ✅ 4 種動作狀態（站立、行走、坐著、說話）
-   ✅ 簡單的 API 進行樣式和動作切換
-   ✅ 動畫播放支援
-   ✅ 職位推薦系統
-   ✅ 完整的 TypeScript 類型支援
-   ✅ JSON 配置整合

系統設計靈活，易於擴展，可以根據需求添加更多樣式和動作。
