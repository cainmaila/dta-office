#!/usr/bin/env python3
"""
驗證 npc-in.png 中每個框架是否真的包含完整辦公桌
"""

from PIL import Image
import numpy as np
import json

def verify_desk_in_all_frames():
    """驗證每個框架是否包含辦公桌"""
    
    try:
        print("🔍 驗證 npc-in.png 每個框架的辦公桌內容...")
        img = Image.open("../static/assets/tilesets/npc-in.png")
        
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        img_array = np.array(img)
        width, height = img.size
        
        # 13x11網格分析
        cols, rows = 13, 11
        cell_width = width // cols
        cell_height = height // rows
        
        print(f"分析網格: {cols}x{rows}, 每格: {cell_width}x{cell_height}")
        print("="*60)
        
        desk_analysis = []
        
        for row in range(rows):
            for col in range(cols):
                frame_index = row * cols + col
                
                # 提取框架內容
                x1 = col * cell_width
                y1 = row * cell_height
                x2 = x1 + cell_width
                y2 = y1 + cell_height
                
                cell_data = img_array[y1:y2, x1:x2]
                
                # 分析這個框架
                analysis = analyze_single_frame(cell_data, frame_index, col, row)
                desk_analysis.append(analysis)
                
                # 即時報告重要發現
                if analysis['has_content']:
                    status = "🏢✅" if analysis['likely_desk'] else "👤" if analysis['likely_character'] else "❓"
                    print(f"框架 {frame_index:3d} ({col:2d},{row:2d}): {status} {analysis['description']}")
        
        # 總結分析
        summarize_desk_analysis(desk_analysis)
        
        return desk_analysis
        
    except Exception as e:
        print(f"驗證時出錯: {e}")
        return None

def analyze_single_frame(cell_data, frame_index, col, row):
    """分析單個框架是否包含辦公桌"""
    
    alpha = cell_data[:, :, 3]
    content_pixels = np.sum(alpha > 0)
    total_pixels = cell_data.shape[0] * cell_data.shape[1]
    coverage = content_pixels / total_pixels
    
    analysis = {
        'frame_index': frame_index,
        'position': (col, row),
        'coverage': coverage,
        'has_content': coverage > 0.1,
        'likely_desk': False,
        'likely_character': False,
        'description': '空框架'
    }
    
    if coverage < 0.1:
        return analysis
    
    # 分析有內容的框架
    content_mask = alpha > 0
    rgb_content = cell_data[content_mask][:, :3]
    
    if len(rgb_content) == 0:
        return analysis
    
    # 檢測辦公桌特徵
    desk_score = detect_desk_features(rgb_content, cell_data, content_mask)
    
    # 檢測人物特徵  
    character_score = detect_character_features(rgb_content)
    
    # 判斷內容類型
    if desk_score > 0.3 and character_score > 0.1:
        analysis['likely_desk'] = True
        analysis['likely_character'] = True
        analysis['description'] = f'辦公桌+人物 (桌:{desk_score:.1f}, 人:{character_score:.1f})'
    elif desk_score > 0.4:
        analysis['likely_desk'] = True
        analysis['description'] = f'主要是辦公桌 (桌:{desk_score:.1f})'
    elif character_score > 0.3:
        analysis['likely_character'] = True  
        analysis['description'] = f'主要是人物 (人:{character_score:.1f})'
    else:
        analysis['description'] = f'混合內容 (桌:{desk_score:.1f}, 人:{character_score:.1f})'
    
    return analysis

def detect_desk_features(rgb_content, cell_data, content_mask):
    """檢測辦公桌特徵"""
    
    # 辦公桌通常有：
    # 1. 水平線條 (桌面邊緣)
    # 2. 矩形結構
    # 3. 木色或金屬色
    # 4. 規則的幾何形狀
    
    # 顏色特徵檢測
    wood_colors = detect_wood_colors(rgb_content)
    metal_colors = detect_metal_colors(rgb_content) 
    
    # 結構特徵檢測 (簡化版)
    structure_score = detect_geometric_structure(cell_data, content_mask)
    
    # 綜合評分
    desk_score = (wood_colors * 0.4 + metal_colors * 0.3 + structure_score * 0.3)
    
    return desk_score

def detect_wood_colors(rgb_content):
    """檢測木色"""
    wood_conditions = (
        (rgb_content[:, 0] > 80) &   # R > 80
        (rgb_content[:, 1] > 40) &   # G > 40
        (rgb_content[:, 2] < 80) &   # B < 80 
        (rgb_content[:, 0] > rgb_content[:, 2])  # 偏棕色
    )
    return np.sum(wood_conditions) / len(rgb_content)

def detect_metal_colors(rgb_content):
    """檢測金屬/灰色"""
    metal_conditions = (
        (np.abs(rgb_content[:, 0] - rgb_content[:, 1]) < 25) &
        (np.abs(rgb_content[:, 1] - rgb_content[:, 2]) < 25) &
        (rgb_content[:, 0] > 60) & (rgb_content[:, 0] < 180)
    )
    return np.sum(metal_conditions) / len(rgb_content)

def detect_geometric_structure(cell_data, content_mask):
    """檢測幾何結構 (簡化版)"""
    
    # 檢測水平線條密度
    h, w = content_mask.shape
    horizontal_lines = 0
    
    for y in range(h//4, 3*h//4):  # 中間區域
        line_density = np.sum(content_mask[y, :]) / w
        if line_density > 0.6:  # 60%以上有內容
            horizontal_lines += 1
    
    structure_score = min(horizontal_lines / (h//2), 1.0)
    return structure_score

def detect_character_features(rgb_content):
    """檢測人物特徵"""
    
    # 膚色檢測
    skin_conditions = (
        (rgb_content[:, 0] > 95) &
        (rgb_content[:, 1] > 40) &  
        (rgb_content[:, 2] > 20) &
        (rgb_content[:, 0] > rgb_content[:, 1]) &
        (rgb_content[:, 0] > rgb_content[:, 2])
    )
    
    # 衣服色彩檢測
    clothing_conditions = (
        (rgb_content[:, 2] > rgb_content[:, 0] + 20) |  # 藍色系
        ((rgb_content[:, 0] > 180) & (rgb_content[:, 1] > 180) & (rgb_content[:, 2] > 180)) |  # 白色
        ((rgb_content[:, 0] < 60) & (rgb_content[:, 1] < 60) & (rgb_content[:, 2] < 60))  # 黑色
    )
    
    character_pixels = np.sum(skin_conditions | clothing_conditions)
    return character_pixels / len(rgb_content)

def summarize_desk_analysis(desk_analysis):
    """總結辦公桌分析結果"""
    
    print("\n" + "="*60)
    print("📊 辦公桌內容驗證總結")
    print("="*60)
    
    # 統計分類
    total_frames = len(desk_analysis)
    has_content = [a for a in desk_analysis if a['has_content']]
    desk_frames = [a for a in desk_analysis if a['likely_desk']]
    character_only = [a for a in desk_analysis if a['likely_character'] and not a['likely_desk']]
    empty_frames = [a for a in desk_analysis if not a['has_content']]
    
    print(f"📈 統計結果:")
    print(f"  總框架數: {total_frames}")
    print(f"  有內容框架: {len(has_content)} ({len(has_content)/total_frames:.1%})")
    print(f"  包含辦公桌: {len(desk_frames)} ({len(desk_frames)/total_frames:.1%})")
    print(f"  僅有人物: {len(character_only)} ({len(character_only)/total_frames:.1%})")
    print(f"  空框架: {len(empty_frames)} ({len(empty_frames)/total_frames:.1%})")
    
    print(f"\n🏢 包含辦公桌的框架:")
    for analysis in desk_frames[:10]:  # 顯示前10個
        frame = analysis['frame_index']
        desc = analysis['description']
        print(f"  Frame {frame:3d}: {desc}")
    
    if len(desk_frames) > 10:
        print(f"  ... 還有 {len(desk_frames)-10} 個框架包含辦公桌")
    
    print(f"\n👤 僅有人物的框架:")
    for analysis in character_only[:5]:  # 顯示前5個
        frame = analysis['frame_index']
        desc = analysis['description']
        print(f"  Frame {frame:3d}: {desc}")
    
    # 關鍵發現
    print(f"\n💡 關鍵發現:")
    if len(desk_frames) > 0:
        print(f"  ✅ 確實有 {len(desk_frames)} 個框架包含辦公桌")
        print(f"  🎯 建議使用框架: {[a['frame_index'] for a in desk_frames[:5]]}")
    else:
        print(f"  ⚠️  沒有找到明確的辦公桌內容")
        print(f"  🔍 可能需要重新評估 npc-in.png 的實際內容")
    
    if len(character_only) > 0:
        print(f"  👤 有 {len(character_only)} 個框架僅包含人物")
        
    return {
        'total': total_frames,
        'with_content': len(has_content),
        'with_desk': len(desk_frames), 
        'character_only': len(character_only),
        'desk_frames': [a['frame_index'] for a in desk_frames]
    }

def main():
    """主函數"""
    
    print("🔍 開始驗證每個框架的辦公桌內容...")
    
    result = verify_desk_in_all_frames()
    
    if result:
        # 保存詳細分析結果
        with open("../static/assets/data/desk_verification.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\n💾 詳細驗證結果已保存")

if __name__ == "__main__":
    main()