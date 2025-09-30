# 圓桌 NPC 熱區互動 PRD

## 1. 背景與目的

目前遊戲主場景使用靜態背景圖 `bg6.png`，背景中的圓桌有 5 位角色已直接繪製在底圖上。為了新增互動性，需要讓這 5 位角色具備與既有 NPC 相同的互動行為（滑鼠指向提示 + 點擊顯示對話泡泡），但無法使用獨立 sprite，因此需建立「熱區 NPC」機制。

## 2. 目標與成功指標

-   **互動一致性**：玩家可對圓桌上的每位角色進行滑鼠懸停與點擊，獲得對話泡泡。
-   **資料驅動**：角色資訊（名稱、對話、座標等）以 JSON 或 TypeScript 資料表形式集中管理，方便後續維護。
-   **易於調整**：支援簡單的座標調校（可透過開發模式印出指標座標或開啟 debug overlay）。

成功指標：

1. 5 個熱區對應到正確的桌上角色位置。
2. 滑鼠懸停有指標與視覺提示，點擊出現專屬對話泡泡並於 4 秒後淡出。
3. 對話內容可從資料表修改而不需變更程式碼。

## 3. 功能需求

### 3.1 使用者故事

-   作為玩家，我將滑鼠移到圓桌角色上時，希望知道該角色可互動（游標改變、角色高亮）。
-   作為玩家，點擊圓桌角色時，希望看到專屬的對話氣泡，像其他 NPC 一樣。
-   作為開發者，希望可以用資料檔快速更新角色名字、對話、熱區位置，不需改動遊戲邏輯。

### 3.2 互動流程

1. 遊戲載入後，`Game` 場景在 `create()` 階段建立 5 個隱形熱區（`Phaser.GameObjects.Zone`）。
2. 熱區與對話資料由新的 `roundTableNpcs` 配置提供。
3. 滑鼠懸停熱區：
    - 改變游標為 pointer。
    - 可選擇加入淡入的高亮圈或名稱標籤（可在 MVP 後追加）。
4. 點擊熱區：
    - 觸發 `scene.events.emit('show-dialogue', ...)`，沿用 `DialogueManager` 機制。
    - 對話泡泡位置以熱區中心（或微調偏移）作為 anchor。
5. 離開熱區：游標恢復預設狀態。

### 3.3 非功能性需求

-   不新增新的 Phaser 場景。
-   不影響現有 NPC 管理邏輯（可之後將一般 NPC 與熱區 NPC 整合成統一管理器）。
-   支援未來擴充（例如會議室、茶水間的背景角色）。

## 4. 技術設計

### 4.1 資料結構

新增 `src/game/data/roundTableNpcs.ts`（或 `json`）輸出陣列，每筆包含：

```ts
export interface HotspotNPC {
    id: string;
    name: string;
    dialogue: string;
    x: number; // 熱區中心 (Phaser 座標)
    y: number;
    radius: number; // Zone 半徑，可依角色大小調整
    bubbleOffsetX?: number; // 非必填，微調泡泡 X 位置
    bubbleOffsetY?: number; // 非必填，微調泡泡 Y 位置
}
```

### 4.2 座標取得流程

1. 啟動開發模式。
2. 在 `Game` 場景 `pointermove` 事件中印出 `pointer.worldX`, `pointer.worldY`，方便記錄熱區中心。
3. 將量測結果填入 `roundTableNpcs` 資料表。
4. 調整 `radius` 以覆蓋角色頭部範圍。

#### 4.2.1 座標量測結果（2025-09-30）

透過 `H` 鍵開啟的熱區除錯工具（顯示半透明圓形與角色標籤），配合 Python clustering 輔助，量測圓桌五位角色的中心點如下：

| 角色                    | X   | Y   | 半徑建議 | 主要任務               |
| ----------------------- | --- | --- | -------- | ---------------------- |
| round_table_host        | 417 | 325 | 55       | 主持開場，統籌討論節奏 |
| round_table_marketing   | 636 | 387 | 55       | 報告行銷活動成效       |
| round_table_analyst     | 418 | 506 | 58       | 分享最新數據洞察       |
| round_table_tech        | 648 | 642 | 62       | 介紹技術 PoC 進度      |
| round_table_coordinator | 415 | 694 | 60       | 安排跨部門資源與會議   |

> 註：`bubbleOffsetY` 目前依視覺微調設定為 -185 ~ -215，後續可依實測調整。

### 4.3 場景載入流程

-   在 `Game.create()` 中呼叫 `this.createRoundTableHotspots()`：
    1. 遍歷 `roundTableNpcs` 資料表。
    2. 為每筆資料建立 `Zone` 物件 `this.add.zone(x, y, radius*2, radius*2)`。
    3. 設定 `setCircleDropZone(radius)` 或手動處理 `pointerover`/`pointerout`。
    4. 設置互動：
        ```ts
        zone.setInteractive({ useHandCursor: true })
            .on('pointerover', () => { this.input.setDefaultCursor('pointer'); })
            .on('pointerout', () => { this.input.setDefaultCursor('default'); })
            .on('pointerdown', () => this.events.emit('show-dialogue', { ... }));
        ```
    5. 事件 payload 包含 `name`, `message`, `x + (bubbleOffsetX ?? 0)`, `y + (bubbleOffsetY ?? -150)` 等資訊。

### 4.4 對話顯示

沿用 `DialogueManager.showDialogue()`，無需改動。泡泡預設在角色頭頂，若有重疊，可透過個別 `bubbleOffset` 微調。

### 4.5 可選強化

-   顯示透明高亮圈：建立 `graphics` 繪製圓形，隨 `pointerover` 顯示/隱藏。
-   可遷移至 `NPCManager`：新增 `createHotspotNPCs()` 與既有 Sprite NPC 共用。
-   使用 `Depth` 控制：必要時設定在背景上層、對話泡泡下層。

## 5. 里程碑與拆解

| 里程碑 | 工作項目                         | 預估     |
| ------ | -------------------------------- | -------- |
| M1     | 指標座標量測 + 建立資料表        | 1 人日   |
| M2     | 建立 Zone 互動機制、觸發對話     | 1 人日   |
| M3     | 細節調整（偏移、高亮、文件更新） | 0.5 人日 |

## 6. 風險與對策

-   **熱區位置不準**：使用開發輔助印出座標並迭代調整；可在遊戲中加上暫時性的 debug 視覺化。
-   **對話內容重疊或遮擋**：透過 `bubbleOffset` 調整，必要時增加 `maxWidth` 或 `wordWrap` 調整。
-   **未來擴充性**：資料表設計成泛用結構，可複用到其他背景角色或場景。

## 7. 後續工作

-   建立 `roundTableNpcs.ts` + 座標数据。
-   實作 `createRoundTableHotspots()`。
-   撰寫測試腳本或 QA 清單（例如逐一點擊 5 位角色，確認對話內容、顯示位置、消失時間）。
-   更新 `doc/開發日誌.md` 記錄變更。
