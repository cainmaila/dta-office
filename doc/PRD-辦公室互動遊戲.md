# PRD - 辦公室互動遊戲

## 產品概述

### 項目名稱
DTA Office - 2D辦公室互動遊戲

### 產品定位
小品休閒互動遊戲，玩家通過點擊辦公室中的NPC觸發對話，體驗虛擬辦公室社交互動。

### 技術棧
- **遊戲引擎**: Phaser 3.90.0
- **UI框架**: Svelte 5.23.1  
- **程式語言**: TypeScript 5.7.2
- **建構工具**: Vite 6.3.1
- **部署平台**: Vercel + Git

## 功能需求

### 1. 遊戲場景
- **畫布尺寸**: 1024x1024 正方形
- **背景素材**: 使用 `static/assets/tilesets/office_bg2.png`
- **視角**: 等軸測圖，參考 `doc/game.png` 的風格
- **響應式**: 等比縮放不裁切，多餘區域黑色背景

### 2. NPC系統

#### 2.1 NPC配置
```json
{
  "npcs": [
    {
      "id": "npc_001",
      "name": "張經理", 
      "position": "產品經理",
      "personality": "嚴謹負責",
      "sprite": "npc_desk_001.png",
      "dialogue": "歡迎來到我們公司，有什麼可以幫助你的嗎？",
      "x": 300,
      "y": 400,
      "npcType": "desk" // desk坐著辦公, standing站著, meeting討論中
    }
  ]
}
```

#### 2.2 NPC分布設計
- **總數量**: 15-20個NPC
- **坐著辦公**: 8-10人（在辦公桌前）
- **站著討論**: 3-4人（小組討論）
- **走廊/茶水間**: 2-3人（休息區）
- **會議區**: 2-3人（會議桌旁）

#### 2.3 NPC素材需求
- **基礎類型**: 3種不同姿勢（坐著、站著、討論）
- **顏色變化**: 每種類型多種顏色組合
- **目標**: 組合出20個不同的NPC
- **風格**: 參考現有素材 npc-a.png, npc-in.png 等

### 3. 對話系統

#### 3.1 對話氣泡
- **樣式**: 白底黑字，圓角方形
- **尺寸**: 自適應文字內容，最大寬度不超過畫布1/3
- **位置**: NPC頭頂上方，帶指向尾巴
- **顯示時間**: 4秒自動消失
- **多行支援**: 支援自動換行

#### 3.2 觸發機制
- **觸發方式**: 滑鼠點擊/手機觸控
- **點擊區域**: NPC圖片範圍
- **限制**: 同時只顯示一個對話氣泡

### 4. 響應式設計
- **桌面端**: 1024x1024 畫布居中顯示
- **手機端**: 等比縮放適應螢幕，支援橫屏豎屏
- **最小解析度**: 等比縮放，不設最小限制
- **操作**: 觸控友好的點擊區域

## 技術設計

### 1. 項目結構
```
src/
├── game/
│   ├── scenes/
│   │   ├── OfficeScene.ts        # 主遊戲場景
│   │   └── PreloadScene.ts       # 資源預載場景
│   ├── objects/
│   │   ├── NPC.ts               # NPC物件類
│   │   └── DialogueBubble.ts    # 對話氣泡類
│   ├── managers/
│   │   ├── NPCManager.ts        # NPC管理器
│   │   └── DialogueManager.ts   # 對話管理器
│   ├── data/
│   │   └── npcs.json           # NPC配置檔
│   └── main.ts
├── components/
│   └── PhaserGame.svelte
└── routes/
    └── +page.svelte

static/assets/
├── backgrounds/
│   └── office_bg2.png
├── npcs/
│   ├── [生成的NPC素材]
└── ui/
    └── [對話氣泡素材]
```

### 2. 核心類設計

#### 2.1 NPC類
```typescript
class NPC extends Phaser.GameObjects.Sprite {
  id: string;
  npcData: NPCData;
  clickArea: Phaser.Geom.Rectangle;
  
  constructor(scene, x, y, texture, npcData);
  setupInteraction(): void;
  showDialogue(): void;
}
```

#### 2.2 對話氣泡類
```typescript
class DialogueBubble extends Phaser.GameObjects.Container {
  background: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  tail: Phaser.GameObjects.Graphics;
  
  constructor(scene, x, y, message);
  show(duration: number): void;
  hide(): void;
}
```

## 開發計劃

### 階段一：基礎場景載入 ✅
- [x] 修改畫布尺寸為1024x1024
- [x] 載入office_bg2.png背景
- [x] 實現響應式等比縮放
- [x] 基礎場景初始化

### 階段二：NPC放置系統
- [ ] 設計並生成NPC素材
- [ ] 創建NPC配置檔案
- [ ] 實現NPC物件類
- [ ] 在場景中放置NPC
- [ ] 添加點擊檢測

### 階段三：對話氣泡系統
- [ ] 設計對話氣泡UI
- [ ] 實現對話氣泡顯示邏輯
- [ ] 添加指向尾巴效果
- [ ] 實現自動消失機制

### 階段四：響應式優化
- [ ] 手機端操作優化
- [ ] 跨設備測試
- [ ] 性能優化
- [ ] 最終整合測試

## 驗收標準

### 功能驗收
1. 遊戲可正常載入辦公室背景
2. NPC可被點擊觸發對話
3. 對話氣泡正確顯示在NPC頭頂
4. 4秒後對話氣泡自動消失
5. 響應式設計在各設備正常運作

### 性能標準
- 載入時間 < 3秒
- 60FPS 流暢運行
- 手機端流暢交互

### 瀏覽器支援
- Chrome 90+
- Safari 14+
- Firefox 88+
- 移動端瀏覽器

## 後續擴展規劃
1. **AI LLM 集成**: 動態對話生成
2. **動畫效果**: NPC閒置動畫
3. **音效系統**: 背景音樂和互動音效
4. **更多場景**: 多個辦公室區域
5. **社交功能**: 多人在線互動

## 開發確認流程
每個階段完成後：
1. 開發者通知階段完成
2. 產品經理執行 `pnpm dev` 測試
3. 反饋修改意見或確認進入下一階段
4. 重複直到項目完成

---
**創建時間**: 2024年
**最後更新**: 階段一開發前
**狀態**: 需求確認完成，準備開發