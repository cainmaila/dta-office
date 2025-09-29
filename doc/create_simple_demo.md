# NPC 素材庫處理成果

## 🎯 處理完成的內容

### 1. 分析了NPC素材圖片
- 素材圖片: `static/assets/tilesets/npc.png` (1024x1024)
- 網格結構: 13x11 = 143個角色框架
- 每個框架大小: 78x93 像素

### 2. 創建了NPC素材處理工具
- 位置: `tools/sprite_processor.py`
- 功能: 
  - 分析sprite sheet結構
  - 創建atlas配置文件
  - 生成角色定義文件
  - 更新NPC數據格式

### 3. 生成的配置文件

#### Atlas配置 (`static/assets/data/npc_atlas.json`)
- 定義了143個角色框架的位置信息
- 格式符合Phaser.js atlas標準
- 每個框架都有準確的座標和尺寸

#### 角色定義 (`static/assets/data/npc_characters.json`)
```json
{
  "business_suit_male_1": {
    "description": "男性商務套裝角色 1",
    "frames": {
      "idle": [0, 1, 2],
      "walking": [13, 14, 15, 16],
      "sitting": [26, 27],
      "talking": [39, 40, 41]
    },
    "recommended_for": ["經理", "主管", "客戶"]
  },
  "business_suit_female_1": {
    "description": "女性商務套裝角色 1",
    "frames": {
      "idle": [3, 4, 5],
      "walking": [17, 18, 19, 20],
      "sitting": [28, 29],
      "talking": [42, 43, 44]
    },
    "recommended_for": ["經理", "設計師", "專員"]
  }
  // ... 更多角色類型
}
```

#### 更新的NPC數據 (`static/assets/data/npcs_updated.json`)
```json
{
  "npcs": [
    {
      "id": "npc_001",
      "name": "李經理",
      "position": "產品經理",
      "personality": "嚴謹負責",
      "x": 300,
      "y": 400,
      "character_type": "business_suit_male_1",
      "current_frame": "idle",
      "dialogue": "歡迎來到我們公司！有什麼可以幫助你的嗎？",
      "npcType": "desk"
    }
    // ... 更多NPC
  ]
}
```

### 4. 更新的代碼結構

#### NPCTypes.ts - 新增介面定義
- `NPCCharacterDefinition`: 角色動畫幀定義
- `NPCAtlasFrame`: Atlas框架結構定義
- 更新 `NPCData` 支援新的角色系統

#### NPC.ts - 增強的NPC類
- 支援動態角色類型載入
- 自動動畫播放 (idle, walking, sitting, talking)
- 滑鼠互動時切換動畫狀態
- 回退系統支援舊的sprite sheet

#### NPCManager.ts - 改進的管理器
- 支援新舊數據格式
- 自動轉換legacy sprite到新角色類型
- 容錯處理和備用數據

#### Game.ts - 場景更新
- 支援atlas紋理載入
- 保留備用的spritesheet系統
- 優雅的錯誤處理和回退機制

## 🚀 使用方式

### 1. 運行sprite處理工具
```bash
cd tools
python3 sprite_processor.py
```

### 2. 在Phaser中載入新的NPC系統
```typescript
// 在Game.ts的preload中
this.load.atlas('npc-atlas', 'tilesets/npc.png', 'data/npc_atlas.json');

// 創建NPC
const npcManager = new NPCManager(this);
await npcManager.loadNPCData();
npcManager.createNPCs();
```

### 3. NPC互動功能
- 滑鼠懸停: 切換到talking動畫
- 點擊: 顯示對話並播放talking動畫
- 自動: 平時保持idle動畫狀態

## 🎨 角色素材庫特點

### 支援的角色類型
1. **business_suit_male_1** - 男性商務套裝
2. **business_suit_female_1** - 女性商務套裝  
3. **casual_male_1** - 男性休閒服裝
4. **casual_female_1** - 女性休閒服裝

### 支援的動畫狀態
- **idle**: 靜止待機動畫
- **walking**: 行走動畫
- **sitting**: 坐著動畫  
- **talking**: 說話動畫

### 自動化功能
- 框架位置自動計算
- 動畫循環播放
- 錯誤容錯處理
- 向後兼容舊系統

## 🔧 技術特點

1. **模組化設計**: 每個組件都可以獨立使用
2. **容錯處理**: 自動回退到備用系統
3. **效能優化**: 使用atlas減少紋理切換
4. **易於擴展**: 輕鬆添加新角色類型和動畫
5. **開發友好**: 詳細的日誌和錯誤信息

這個NPC素材庫系統現在已經準備好可以在辦公室遊戲中使用，提供豐富的角色動畫和互動功能！