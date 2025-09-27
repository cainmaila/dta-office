# Tileset 素材分析與處理計劃

## 發現的問題
當前NPC顯示異常，原因是素材文件是4x4的tileset點陣圖，而不是單一圖片。

## 素材分析
- **圖片尺寸**: 1024x1024 像素
- **Tileset格式**: 4x4 網格
- **每個tile大小**: 256x256 像素 (1024÷4)
- **總tile數量**: 16個 (4x4)

## 需要處理的文件
- `npc-a.png` - NPC角色A tileset
- `npc-in.png` -室內NPC tileset  
- `npc.png` - 通用NPC tileset
- `npm-b.png` - NPC角色B tileset
- `office_bg2.png` - 辦公室背景tileset

## 處理方案

### 方案一：在Phaser中直接使用Tileset
```javascript
// 載入為tileset
this.load.spritesheet('npc-a-sheet', 'tilesets/npc-a.png', {
    frameWidth: 256,
    frameHeight: 256
});

// 使用特定frame
this.add.sprite(x, y, 'npc-a-sheet', frameIndex);
```

### 方案二：提取並生成單獨圖片
使用程式提取每個256x256的tile並保存為獨立文件。

## 實施計劃

### 第一步：分析tileset內容
1. 載入tileset為spritesheet
2. 檢查每個frame的內容
3. 識別可用的NPC角色

### 第二步：更新NPC系統
1. 修改preload()載入spritesheet
2. 更新createInteractiveNPCs()使用正確的frame
3. 為每個NPC選擇合適的tile

### 第三步：測試和優化
1. 確保所有NPC正確顯示
2. 檢查視覺效果和比例
3. 優化性能

## 預期結果
- NPC角色正確顯示為獨立的256x256圖像
- 可以從tileset中選擇不同的角色造型
- 為20個NPC提供足夠的素材變化

## 下一步行動
立即實施方案一，在Phaser中使用spritesheet載入tileset。