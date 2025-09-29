#!/usr/bin/env python3
"""
重新分析去背後的 npc-in.png - 辦公桌與人物組合分析
"""

from PIL import Image
import numpy as np
import json

def analyze_furniture_with_npcs():
    """分析包含辦公桌與人物的 npc-in.png"""
    
    try:
        print("🔍 重新分析去背後的 npc-in.png...")
        img = Image.open("../static/assets/tilesets/npc-in.png")
        width, height = img.size
        
        print(f"圖片尺寸: {width}x{height}")
        print(f"色彩模式: {img.mode}")
        
        # 轉換為RGBA確保有透明度信息
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        img_array = np.array(img)
        
        # 分析透明度 - 去背後應該有透明區域
        alpha_channel = img_array[:, :, 3]
        transparent_pixels = np.sum(alpha_channel == 0)
        non_transparent_pixels = np.sum(alpha_channel > 0)
        total_pixels = width * height
        
        transparency_ratio = transparent_pixels / total_pixels
        content_ratio = non_transparent_pixels / total_pixels
        
        print(f"透明區域: {transparency_ratio:.1%}")
        print(f"內容區域: {content_ratio:.1%}")
        print("✅ 確認是去背圖片" if transparency_ratio > 0.1 else "⚠️ 可能未完全去背")
        
        # 分析網格中的辦公桌+人物組合
        analyze_desk_npc_combinations(img_array, width, height)
        
        # 與純NPC圖片對比
        compare_with_pure_npc()
        
        return {
            'size': [width, height],
            'transparency_ratio': float(transparency_ratio),
            'content_ratio': float(content_ratio),
            'type': 'furniture_with_npcs'
        }
        
    except Exception as e:
        print(f"分析時出錯: {e}")
        return None

def analyze_desk_npc_combinations(img_array, width, height):
    """分析辦公桌+人物的組合"""
    
    print("\n🏢 分析辦公桌+人物組合...")
    
    # 使用13x11網格分析
    cols, rows = 13, 11
    cell_width = width // cols
    cell_height = height // rows
    
    alpha_channel = img_array[:, :, 3]
    combinations = []
    
    for row in range(rows):
        for col in range(cols):
            x1 = col * cell_width
            y1 = row * cell_height
            x2 = x1 + cell_width
            y2 = y1 + cell_height
            
            # 提取格子內容
            cell_alpha = alpha_channel[y1:y2, x1:x2]
            cell_rgb = img_array[y1:y2, x1:x2, :3]
            
            # 計算內容覆蓋率
            content_pixels = np.sum(cell_alpha > 0)
            coverage = content_pixels / (cell_width * cell_height)
            
            if coverage > 0.2:  # 20%以上有內容
                # 分析顏色分佈來判斷內容類型
                content_mask = cell_alpha > 0
                if np.sum(content_mask) > 0:
                    rgb_content = cell_rgb[content_mask]
                    
                    # 檢測家具色調（通常是木色、金屬色）
                    furniture_score = detect_furniture_colors(rgb_content)
                    # 檢測人物色調（膚色、衣服色）
                    character_score = detect_character_colors(rgb_content)
                    
                    combinations.append({
                        'position': (col, row),
                        'index': row * cols + col,
                        'coverage': coverage,
                        'furniture_score': furniture_score,
                        'character_score': character_score,
                        'type': classify_content_type(furniture_score, character_score)
                    })
    
    # 按內容覆蓋率排序
    combinations.sort(key=lambda x: x['coverage'], reverse=True)
    
    print(f"找到 {len(combinations)} 個有內容的格子:")
    
    # 顯示前10個最有內容的格子
    for i, combo in enumerate(combinations[:10]):
        pos = combo['position']
        content_type = combo['type']
        print(f"  格子({pos[0]:2d}, {pos[1]:2d}) [索引{combo['index']:2d}]: "
              f"覆蓋率{combo['coverage']:.1%} - {content_type}")
    
    return combinations

def detect_furniture_colors(rgb_pixels):
    """檢測家具顏色特徵"""
    if len(rgb_pixels) == 0:
        return 0.0
    
    # 家具通常是：
    # - 木色 (棕色系)
    # - 金屬色 (灰色系)
    # - 黑色/白色 (辦公設備)
    
    # 檢測木色
    wood_conditions = (
        (rgb_pixels[:, 0] > 100) &  # R > 100
        (rgb_pixels[:, 1] > 50) &   # G > 50
        (rgb_pixels[:, 2] < 100) &  # B < 100
        (rgb_pixels[:, 0] > rgb_pixels[:, 2])  # R > B (偏紅棕色)
    )
    
    # 檢測金屬/灰色
    metal_conditions = (
        (np.abs(rgb_pixels[:, 0] - rgb_pixels[:, 1]) < 30) &  # R ≈ G
        (np.abs(rgb_pixels[:, 1] - rgb_pixels[:, 2]) < 30) &  # G ≈ B
        (rgb_pixels[:, 0] > 50) & (rgb_pixels[:, 0] < 200)    # 中等亮度
    )
    
    furniture_pixels = np.sum(wood_conditions | metal_conditions)
    return furniture_pixels / len(rgb_pixels)

def detect_character_colors(rgb_pixels):
    """檢測人物顏色特徵"""
    if len(rgb_pixels) == 0:
        return 0.0
    
    # 人物通常有：
    # - 膚色
    # - 衣服色彩 (多樣化)
    # - 頭髮色 (黑、棕、金等)
    
    # 膚色檢測 (改進版)
    skin_conditions = (
        (rgb_pixels[:, 0] > 95) &   # R > 95
        (rgb_pixels[:, 1] > 40) &   # G > 40  
        (rgb_pixels[:, 2] > 20) &   # B > 20
        (rgb_pixels[:, 0] > rgb_pixels[:, 1]) &  # R > G
        (rgb_pixels[:, 0] > rgb_pixels[:, 2]) &  # R > B
        (rgb_pixels[:, 1] > rgb_pixels[:, 2])    # G > B
    )
    
    # 衣服色彩檢測 (高飽和度或特殊顏色)
    clothing_conditions = (
        # 藍色系 (襯衫、西裝)
        (rgb_pixels[:, 2] > rgb_pixels[:, 0] + 30) |
        # 白色系 (襯衫)
        ((rgb_pixels[:, 0] > 200) & (rgb_pixels[:, 1] > 200) & (rgb_pixels[:, 2] > 200)) |
        # 黑色系 (正裝)
        ((rgb_pixels[:, 0] < 50) & (rgb_pixels[:, 1] < 50) & (rgb_pixels[:, 2] < 50))
    )
    
    character_pixels = np.sum(skin_conditions | clothing_conditions)
    return character_pixels / len(rgb_pixels)

def classify_content_type(furniture_score, character_score):
    """分類內容類型"""
    if furniture_score > 0.3 and character_score > 0.2:
        return "🏢👤 辦公桌+人物"
    elif furniture_score > 0.4:
        return "🏢 純辦公桌"
    elif character_score > 0.3:
        return "👤 純人物"
    elif furniture_score > 0.1 or character_score > 0.1:
        return "🔍 混合內容"
    else:
        return "❓ 未知內容"

def compare_with_pure_npc():
    """與純NPC圖片對比"""
    
    print("\n🔄 與 npc.png 對比分析...")
    
    try:
        npc_img = Image.open("../static/assets/tilesets/npc.png")
        print(f"npc.png (純人物): {npc_img.size}, {npc_img.mode}")
        print("npc-in.png (辦公桌+人物): 已分析，包含家具元素")
        
        print("\n💡 使用建議:")
        print("1. npc.png - 適合獨立人物角色")
        print("2. npc-in.png - 適合展示工作場景 (人+桌)")
        print("3. 可以組合使用創造豐富的辦公室環境")
        
    except Exception as e:
        print(f"對比分析時出錯: {e}")

def generate_usage_ideas():
    """生成使用創意"""
    
    print("\n" + "="*60)
    print("💡 辦公桌+人物組合的創新應用")
    print("="*60)
    
    ideas = [
        {
            "title": "工作場景系統",
            "description": "使用辦公桌+人物組合創建真實的工作場景",
            "benefits": ["更真實的辦公環境", "減少素材組合工作", "統一的視覺風格"],
            "implementation": "直接使用 npc-in.png 的格子作為完整的工作站"
        },
        {
            "title": "混合場景佈局",
            "description": "純人物(npc.png) + 工作場景(npc-in.png) 的組合使用",
            "benefits": ["場景層次豐富", "互動多樣化", "空間利用最大化"],
            "implementation": "走廊用純人物，工作區用辦公桌+人物"
        },
        {
            "title": "動態場景切換",
            "description": "根據時間或事件在純人物和工作場景間切換",
            "benefits": ["動態感強", "故事性豐富", "用戶參與度高"],
            "implementation": "會議時間顯示純人物，工作時間顯示辦公桌場景"
        },
        {
            "title": "分層渲染系統",
            "description": "背景用辦公桌，前景用可互動的純人物",
            "benefits": ["視覺深度感", "互動靈活性", "效能優化"],
            "implementation": "辦公桌作為靜態背景，人物作為互動層"
        }
    ]
    
    for i, idea in enumerate(ideas, 1):
        print(f"\n{i}. 🎯 {idea['title']}")
        print(f"   💭 {idea['description']}")
        print(f"   ✨ 優勢: {', '.join(idea['benefits'])}")  
        print(f"   🔧 實現: {idea['implementation']}")
    
    print(f"\n🚀 推薦優先嘗試: 工作場景系統")
    print(f"   理由: 最能體現辦公桌+人物組合的獨特價值")

def main():
    """主函數"""
    
    print("🔍 重新分析辦公桌+人物組合資源...")
    
    # 分析組合內容
    result = analyze_furniture_with_npcs()
    
    # 生成應用創意
    generate_usage_ideas()
    
    # 保存分析結果
    if result:
        with open("../static/assets/data/furniture_npc_analysis.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\n💾 分析結果已保存到: ../static/assets/data/furniture_npc_analysis.json")

if __name__ == "__main__":
    main()