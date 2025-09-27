# 角色Sprite Tileset 深度分析

## 重要發現
用戶確認這些是**像素藝術角色sprite**，具有以下特徵：

### npc.png - 站立角色
- **格式**: w13h11 (寬13列，高11行的網格)
- **內容**: 站著的人物，包含不同方向
- **可能結構**:
  - 第一行: 向下面對的角色
  - 第二行: 向左面對的角色  
  - 第三行: 向右面對的角色
  - 第四行: 向上面對的角色
  - 部分區域: 空白tile

### 其他NPC tilesets
- **npc-a.png**: 角色A的各方向sprite
- **npc-in.png**: 室內角色的各方向sprite  
- **npm-b.png**: 角色B的各方向sprite

## 正確的載入方式

### 當前錯誤
```javascript
// 錯誤: 使用4x4分割
this.load.spritesheet('npc-sheet', 'tilesets/npc.png', {
    frameWidth: 256, // 1024÷4 = 256
    frameHeight: 256
});
```

### 正確方式
```javascript
// 正確: 使用13x11分割
this.load.spritesheet('npc-sheet', 'tilesets/npc.png', {
    frameWidth: Math.floor(1024/13), // ≈78像素
    frameHeight: Math.floor(1024/11)  // ≈93像素
});
```

## 計算結果
- **frameWidth**: 1024 ÷ 13 ≈ 78.77 → 78像素
- **frameHeight**: 1024 ÷ 11 ≈ 93.09 → 93像素
- **總frames**: 13 × 11 = 143個

## 使用策略
1. **選擇有效frames**: 跳過空白區域
2. **方向識別**: 
   - frames 0-12: 朝下
   - frames 13-25: 朝左
   - frames 26-38: 朝右  
   - frames 39-51: 朝上
3. **角色選擇**: 每個方向選擇不同的角色造型

## 下一步
1. 修正所有tileset的frameWidth和frameHeight
2. 測試並識別有效的角色frames
3. 為每個NPC選擇合適的朝向和造型