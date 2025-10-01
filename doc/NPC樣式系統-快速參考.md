# NPC 樣式系統快速參考

## 🎯 核心概念

**npc.png** = 13×11 網格 = 143 幀 = 4 種角色 × 4 種動作

## 📦 樣式 ID 速查

| ID                  | 名稱     | 適合職位           |
| ------------------- | -------- | ------------------ |
| `business_male_1`   | 商務男性 | 經理、主管、總監   |
| `business_female_1` | 商務女性 | 經理、設計師、專員 |
| `casual_male_1`     | 休閒男性 | 工程師、技術員     |
| `casual_female_1`   | 休閒女性 | 助理、設計師       |

## 🎬 動作速查

| 動作 | 英文      | 說明     |
| ---- | --------- | -------- |
| 站立 | `idle`    | 靜止站立 |
| 行走 | `walking` | 走路動作 |
| 坐著 | `sitting` | 坐姿     |
| 說話 | `talking` | 對話姿勢 |

## ⚡ 常用代碼片段

### 切換樣式

```typescript
// 切換成商務男性
npcManager.setNPCStyle("npc_001", "business_male_1", "idle");
```

### 切換動作

```typescript
// 切換成坐著
npcManager.setNPCAction("npc_001", "sitting");
```

### 播放動畫

```typescript
// 播放說話動畫
npcManager.playNPCAnimation("npc_001", "talking", 300);
```

### JSON 配置

```json
{
    "id": "npc_001",
    "name": "李經理",
    "styleId": "business_male_1",
    "action": "idle",
    "npcType": "standing"
}
```

## 🔍 調試

```typescript
// 檢查 NPC 狀態
const npc = npcManager.getNPC("npc_001");
console.log(npc.getCurrentStyle());
console.log(npc.getCurrentAction());
```

## 📍 幀索引範圍

-   business_male_1: 0-41
-   business_female_1: 3-44
-   casual_male_1: 6-47
-   casual_female_1: 9-50

## 🔗 相關檔案

-   `src/game/data/npcStyles.ts` - 樣式定義
-   `src/game/objects/NPC.ts` - NPC 類別
-   `src/game/managers/NPCManager.ts` - 管理器
-   `static/assets/data/npcs.json` - 資料配置
-   `doc/NPC樣式系統.md` - 完整文件
