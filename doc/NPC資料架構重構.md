# NPC 資料架構重構文檔

## 概述

完成了 NPC 資料架構的重大重構,將**人物定義**與**位置呈現方式**解耦,實現了更靈活、可維護的系統架構。

## 重構目標

1. ✅ 將人物基本資料（姓名、對話、角色屬性）與呈現方式（站立/熱區）分離
2. ✅ 使用 ID 進行映射,支援同一人物多個位置
3. ✅ 為 LLM 對話功能預留 `introduction` 欄位
4. ✅ 統一資料管理,減少重複和不一致

## 新架構設計

### 資料結構

#### 1. 人物基本資料 (`Character`)

```typescript
interface Character {
    id: string; // 唯一識別碼 (如 "zhang_manager")
    name: string; // 姓名
    position: string; // 職稱
    personality: string; // 個性標籤
    dialogue: string; // 當前對話內容
    introduction: string; // 自我介紹（詳細版,用於 LLM）
}
```

#### 2. 站立 NPC 配置 (`StandingNpcConfig`)

```typescript
interface StandingNpcConfig {
    characterId: string; // 對應 Character.id
    x: number; // 資料座標 X
    y: number; // 資料座標 Y
    styleId: string; // NPC 樣式 (如 "business_male_1")
    action?: string; // 動作狀態 (如 "idle")
}
```

#### 3. 熱區 NPC 配置 (`HotspotNpcConfig`)

```typescript
interface HotspotNpcConfig {
    characterId: string; // 對應 Character.id
    x: number; // 資料座標 X
    y: number; // 資料座標 Y
    radius: number; // 熱區半徑
    bubbleOffsetX?: number;
    bubbleOffsetY?: number;
    bubbleGap?: number;
}
```

### 檔案結構

```
src/game/data/
  └── characters.json     # 統一資料檔案
      ├── characters[]    # 人物基本資料 (11 位)
      ├── standingNpcs[]  # 站立 NPC 配置 (2 位)
      └── hotspotNpcs[]   # 熱區 NPC 配置 (6 位)
```

## 遷移的人物資料

### 站立 NPC (2 位)

-   **張主管** (`zhang_manager`) - 技術主管,領導風範
-   **林助理** (`lin_assistant`) - 行政助理,親切熱心

### 熱區 NPC (6 位)

-   **主持人艾達** (`ada_host`) - 會議主持人,條理清晰
-   **行銷專員小惠** (`hui_marketing`) - 行銷專員,活潑積極
-   **資料分析師可芸** (`keyun_analyst`) - 資料分析師,邏輯縝密
-   **技術顧問阿哲** (`azhe_tech`) - 技術顧問,務實創新
-   **專案協調師怡君** (`yijun_coordinator`) - 專案協調師,細心周到
-   **資深專員** (`senior_specialist`) - 資深專員,經驗豐富

### 未使用的舊人物 (保留在資料中供未來使用)

-   **李經理** (`li_manager`) - 產品經理,嚴謹負責
-   **王設計師** (`wang_designer`) - UI/UX 設計師,創意滿滿
-   **陳工程師** (`chen_engineer`) - 前端工程師,技術專精

## 程式碼變更

### 新增檔案

-   `src/game/data/characters.json` - 統一的人物與配置資料

### 修改檔案

#### 1. `src/game/types/NPCTypes.ts`

-   ✅ 新增 `Character`, `StandingNpcConfig`, `HotspotNpcConfig`, `CharactersData` 類型
-   ✅ 保留舊類型 (`NPCData`, `HotspotNPC`) 以支援漸進式遷移

#### 2. `src/game/managers/NPCManager.ts`

-   ✅ 新增 `characters` Map 儲存人物資料庫
-   ✅ 改為從 `characters.json` 載入資料
-   ✅ 新增 `getCharacter()` 和 `getAllCharacters()` 方法
-   ✅ 內部將新格式轉換為 NPC 物件所需的舊格式(漸進式遷移)

#### 3. `src/game/scenes/Game.ts`

-   ✅ 新增 `characters` Map 儲存人物資料庫
-   ✅ 改為從 `characters.json` 載入資料
-   ✅ `loadStandingNPCs()` 重命名為 `loadCharactersAndNPCs()`
-   ✅ `createRoundTableHotspots()` 接受 `HotspotNpcConfig[]` 參數
-   ✅ 移除對 `roundTableNpcs.ts` 的依賴

### 刪除檔案

-   ❌ `src/game/data/roundTableNpcs.ts` - 已整合到 characters.json
-   ❌ `src/game/data/npcs.json` - 已整合到 characters.json (可手動刪除)

## 使用範例

### 1. 取得人物資料

```typescript
// 在 NPCManager 中
const character = this.npcManager.getCharacter("zhang_manager");
console.log(character?.introduction); // LLM 用的自我介紹

// 在 Game 場景中
const character = this.characters.get("zhang_manager");
console.log(character?.name); // "張主管"
```

### 2. 新增站立 NPC

在 `characters.json` 中:

```json
{
    "characters": [
        {
            "id": "new_character",
            "name": "新角色",
            "position": "職位",
            "personality": "個性",
            "dialogue": "對話內容",
            "introduction": "詳細自我介紹..."
        }
    ],
    "standingNpcs": [
        {
            "characterId": "new_character",
            "x": 400,
            "y": 300,
            "styleId": "business_male_1"
        }
    ]
}
```

### 3. 新增熱區 NPC

```json
{
    "hotspotNpcs": [
        {
            "characterId": "new_character",
            "x": 500,
            "y": 400,
            "radius": 40,
            "bubbleGap": 18
        }
    ]
}
```

### 4. 同一人物多個位置

```json
{
    "standingNpcs": [
        {
            "characterId": "zhang_manager",
            "x": 200,
            "y": 300,
            "styleId": "business_male_1"
        }
    ],
    "hotspotNpcs": [
        {
            "characterId": "zhang_manager",
            "x": 500,
            "y": 400,
            "radius": 40
        }
    ]
}
```

## ID 命名規範

使用 **拼音 + 職位** 的命名方式:

-   `zhang_manager` - 張主管
-   `lin_assistant` - 林助理
-   `ada_host` - 艾達主持人
-   `hui_marketing` - 小惠行銷專員

## 後續規劃

### 短期 (已完成)

-   ✅ 資料架構解耦
-   ✅ 遷移所有現有 NPC
-   ✅ 保持功能完全相同

### 中期 (待實作)

-   🔄 多輪對話系統 (目前為單句)
-   🔄 LLM 整合使用 `introduction` 欄位
-   🔄 根據遊戲狀態動態改變對話內容

### 長期 (規劃中)

-   📋 人物關係系統
-   📋 對話歷史記錄
-   📋 人物狀態管理
-   📋 更豐富的互動方式

## 測試驗證

### 測試項目

-   ✅ 站立 NPC 正常顯示 (張主管、林助理)
-   ✅ 熱區 NPC 正常顯示 (6 位圓桌成員)
-   ✅ 名字標籤動態顯示 (hover || dialogue)
-   ✅ 對話框正常彈出並顯示正確內容
-   ✅ 建置無錯誤

### 驗證方法

1. 啟動開發伺服器: `pnpm run dev`
2. hover 任意 NPC 查看名字標籤
3. 點擊 NPC 查看對話框內容
4. 確認所有人物姓名和對話正確

## 注意事項

1. **向後相容**: 保留了舊的類型定義 (`NPCData`, `HotspotNPC`),內部會自動轉換
2. **漸進式遷移**: NPC 和 DialogueBubble 類別仍使用舊格式,未來可進一步重構
3. **資料完整性**: 所有 11 位人物都有完整的 `introduction` 欄位供 LLM 使用
4. **多位置支援**: 同一 `characterId` 可出現在多個配置陣列中

## 效益總結

### 架構層面

-   ✅ **解耦合**: 人物資料與呈現方式完全分離
-   ✅ **可擴展**: 輕鬆新增新的呈現方式 (如移動 NPC)
-   ✅ **可維護**: 集中管理人物資料,避免重複

### 開發層面

-   ✅ **DRY 原則**: 人物資料不再重複定義
-   ✅ **類型安全**: TypeScript 完整類型定義
-   ✅ **易於測試**: 資料與邏輯分離

### 未來發展

-   ✅ **LLM 準備**: `introduction` 欄位已就緒
-   ✅ **靈活配置**: 支援同一人物多種呈現
-   ✅ **擴展性**: 易於新增人物和配置

---

**重構完成日期**: 2025 年 10 月 1 日
**建置狀態**: ✅ 成功
**測試狀態**: ✅ 通過
