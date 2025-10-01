# 站立 NPC 面向功能實作

## 概述

為站立 NPC 添加了 `facing` (面向) 功能,支援左右翻轉,讓 NPC 可以面向不同方向。

## 更新日期

2025 年 10 月 2 日

## 功能特性

### 1. **面向設定**

-   支援 `"left"` (面向左) 和 `"right"` (面向右)
-   使用 `scaleX` 實現水平翻轉
    -   `facing: "left"` → `setScale(-1, 1)` (水平翻轉)
    -   `facing: "right"` → `setScale(1, 1)` (正常方向)

### 2. **預設值**

-   `action`: 預設為 `"idle"`
-   `facing`: 預設為 `"left"`

## 資料結構變更

### StandingNpcConfig (新增欄位)

```typescript
export interface StandingNpcConfig {
    characterId: string;
    x: number;
    y: number;
    styleId: string;
    action?: "idle" | "walking" | "sitting" | "talking"; // 動作狀態
    facing?: "left" | "right"; // ✨ 新增: 面向方向
}
```

### 範例配置

```json
{
    "standingNpcs": [
        {
            "characterId": "Kevin",
            "x": 355,
            "y": 575,
            "styleId": "business_male_1",
            "action": "idle",
            "facing": "left"
        }
    ]
}
```

## 程式碼變更

### 1. `src/game/types/NPCTypes.ts`

#### StandingNpcConfig

```typescript
export interface StandingNpcConfig {
    // ... 其他欄位
    facing?: "left" | "right"; // 新增
}
```

#### NPCData (Legacy)

```typescript
export interface NPCData {
    // ... 其他欄位
    facing?: "left" | "right"; // 新增
}
```

### 2. `src/game/managers/NPCManager.ts`

在 `createStandingNPCs` 方法中傳遞 facing:

```typescript
const npcData: NPCData = {
    // ... 其他欄位
    facing: config.facing || "left", // 預設面向左
};
```

### 3. `src/game/objects/NPC.ts`

#### 建構函數中應用 facing

```typescript
constructor(scene: Scene, npcData: NPCData) {
    // ... 初始化程式碼

    // 設置面向方向
    this.applyFacing(npcData.facing || "left");

    // ...
}
```

#### 新增 applyFacing 方法

```typescript
/**
 * 設置 NPC 面向方向
 * @param facing "left" (面向左) 或 "right" (面向右)
 */
private applyFacing(facing: "left" | "right"): void {
    if (facing === "left") {
        this.setScale(-1, 1); // 水平翻轉 (面向左)
    } else {
        this.setScale(1, 1); // 正常 (面向右)
    }
}
```

### 4. `static/assets/data/characters.json`

移除了 `lin_assistant` (不存在的 characterId),只保留 Kevin:

```json
{
    "standingNpcs": [
        {
            "characterId": "Kevin",
            "x": 355,
            "y": 575,
            "styleId": "business_male_1",
            "action": "idle",
            "facing": "left"
        }
    ]
}
```

## 使用範例

### 添加面向左的 NPC

```json
{
    "characterId": "Kevin",
    "x": 355,
    "y": 575,
    "styleId": "business_male_1",
    "action": "idle",
    "facing": "left"
}
```

### 添加面向右的 NPC

```json
{
    "characterId": "Johnny",
    "x": 600,
    "y": 500,
    "styleId": "business_female_1",
    "action": "idle",
    "facing": "right"
}
```

### 省略 facing (使用預設值)

```json
{
    "characterId": "Denny",
    "x": 400,
    "y": 300,
    "styleId": "casual_male_1"
    // facing 預設為 "left"
}
```

## 技術細節

### 翻轉實作

使用 Phaser 的 `setScale(scaleX, scaleY)` 方法:

-   **面向左**: `setScale(-1, 1)` - 水平鏡像翻轉
-   **面向右**: `setScale(1, 1)` - 保持原始方向

### 與其他功能的整合

1. **名字標籤**: 不受 facing 影響,始終正確顯示
2. **對話框**: 位置計算不受 facing 影響
3. **互動區域**: 翻轉後互動區域仍然正確
4. **深度排序**: 翻轉不影響 depth 計算

## 測試項目

### 功能測試

-   ✅ Kevin (facing: "left") 正確面向左邊
-   ✅ 如果添加 facing: "right" 的 NPC,會正確面向右邊
-   ✅ 名字標籤在翻轉後仍正常顯示
-   ✅ 對話框在翻轉後仍正常顯示
-   ✅ hover 和點擊互動正常運作

### 建置測試

-   ✅ TypeScript 編譯無錯誤
-   ✅ 無 lint 警告

## 向後相容性

-   ✅ `facing` 為可選欄位,預設為 `"left"`
-   ✅ 舊的配置不需要修改即可正常運作
-   ✅ 不影響熱區 NPC 的功能

## 未來擴展

### 可能的增強功能

1. **動態轉向**: 支援執行時改變面向
2. **平滑轉向**: 添加轉向動畫
3. **互動導向**: NPC 面向玩家點擊的位置
4. **智能面向**: 根據移動方向自動調整面向

### API 擴展建議

```typescript
// 未來可添加的方法
npc.setFacing("left" | "right");           // 動態設置面向
npc.turnTowards(x, y);                     // 面向指定座標
npc.toggleFacing();                        // 切換面向
npc.getFacing(): "left" | "right";         // 取得當前面向
```

## 注意事項

1. **視覺效果**: 翻轉是即時的,沒有過渡動畫
2. **sprite 設計**: 確保 sprite 設計適合水平翻轉 (對稱或已考慮翻轉效果)
3. **文字元素**: 如果 sprite 包含文字,翻轉後文字也會鏡像,需要特別處理
4. **互動區域**: Phaser 的 setScale 會自動調整互動區域,無需手動處理

## 相關文檔

-   [NPC 資料架構重構.md](./NPC資料架構重構.md) - 資料架構說明
-   [NPC 樣式系統.md](./NPC樣式系統.md) - NPC 樣式系統說明

---

**實作完成日期**: 2025 年 10 月 2 日
**建置狀態**: ✅ 成功
**測試狀態**: ✅ 通過
