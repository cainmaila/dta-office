#!/usr/bin/env python3
"""
重新分析 npc-in.png 的真實規格和內容
不再假設它與 npc.png 使用相同的網格
"""

from PIL import Image
import numpy as np
import json

def analyze_true_structure():
    """重新分析 npc-in.png 的真實結構"""
    
    try:
        print("🔍 重新分析 npc-in.png 的真實結構...")
        img = Image.open("../static/assets/tilesets/npc-in.png")
        width, height = img.size
        
        print(f"圖片基本信息:")
        print(f"  尺寸: {width}x{height}")
        print(f"  模式: {img.mode}")
        
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        img_array = np.array(img)
        
        # 分析透明度分佈
        alpha_channel = img_array[:, :, 3]
        analyze_transparency_pattern(alpha_channel, width, height)
        
        # 嘗試不同的網格假設
        test_different_grid_assumptions(img_array, width, height)
        
        # 分析內容密度分佈
        analyze_content_distribution(img_array, width, height)
        
        return True
        
    except Exception as e:
        print(f"分析時出錯: {e}")
        return False

def analyze_transparency_pattern(alpha_channel, width, height):
    """分析透明度模式來推測結構"""
    
    print(f"\n📊 透明度分析:")
    
    total_pixels = width * height
    transparent_pixels = np.sum(alpha_channel == 0)
    semi_transparent = np.sum((alpha_channel > 0) & (alpha_channel < 255))
    opaque_pixels = np.sum(alpha_channel == 255)
    
    print(f"  完全透明: {transparent_pixels} ({transparent_pixels/total_pixels:.1%})")
    print(f"  半透明: {semi_transparent} ({semi_transparent/total_pixels:.1%})")
    print(f"  不透明: {opaque_pixels} ({opaque_pixels/total_pixels:.1%})")
    
    if transparent_pixels > total_pixels * 0.3:
        print("  💡 大量透明區域 → 可能是分散的物件")
    elif transparent_pixels < total_pixels * 0.1:
        print("  💡 少量透明區域 → 可能是連續的圖像")
    
    # 分析透明度的水平和垂直分佈
    h_transparency = np.mean(alpha_channel == 0, axis=0)  # 每列的透明度
    v_transparency = np.mean(alpha_channel == 0, axis=1)  # 每行的透明度
    
    # 找出透明度變化的邊界（可能是網格線）
    h_edges = find_edges(h_transparency)
    v_edges = find_edges(v_transparency)
    
    if h_edges and v_edges:
        print(f"  🎯 可能的垂直分割點: {len(h_edges)} 個")
        print(f"  🎯 可能的水平分割點: {len(v_edges)} 個")
        
        if len(h_edges) > 0 and len(v_edges) > 0:
            estimated_cols = len(h_edges) + 1
            estimated_rows = len(v_edges) + 1
            print(f"  📐 推測網格: {estimated_cols}x{estimated_rows}")

def find_edges(transparency_line):
    """找出透明度變化的邊界"""
    edges = []
    threshold = 0.3  # 透明度變化閾值
    
    for i in range(1, len(transparency_line)):
        if abs(transparency_line[i] - transparency_line[i-1]) > threshold:
            edges.append(i)
    
    return edges

def test_different_grid_assumptions(img_array, width, height):
    """測試不同的網格假設"""
    
    print(f"\n🔍 測試不同網格假設:")
    
    # 測試多種可能的網格配置
    possible_grids = [
        (1, 1),   # 單一圖像
        (2, 1), (1, 2),  # 2分割
        (3, 1), (1, 3),  # 3分割
        (4, 1), (1, 4),  # 4分割
        (2, 2),   # 2x2
        (3, 2), (2, 3),  # 3x2 或 2x3
        (4, 2), (2, 4),  # 4x2 或 2x4
        (3, 3),   # 3x3
        (4, 3), (3, 4),  # 4x3 或 3x4
        (4, 4),   # 4x4
        (5, 4), (4, 5),  # 5x4 或 4x5
        (6, 4), (4, 6),  # 6x4 或 4x6
        (8, 6), (6, 8),  # 8x6 或 6x8
    ]
    
    alpha_channel = img_array[:, :, 3]
    best_grids = []
    
    for cols, rows in possible_grids:
        if width % cols != 0 or height % rows != 0:
            continue  # 跳過不能整除的網格
            
        cell_width = width // cols
        cell_height = height // rows
        
        # 分析這個網格的內容分佈
        content_cells = 0
        total_coverage = 0
        
        for row in range(rows):
            for col in range(cols):
                x1 = col * cell_width
                y1 = row * cell_height
                x2 = x1 + cell_width
                y2 = y1 + cell_height
                
                cell_alpha = alpha_channel[y1:y2, x1:x2]
                coverage = np.sum(cell_alpha > 0) / (cell_width * cell_height)
                
                if coverage > 0.1:  # 10%以上有內容
                    content_cells += 1
                    total_coverage += coverage
        
        if content_cells > 0:
            avg_coverage = total_coverage / content_cells
            grid_score = content_cells * avg_coverage  # 綜合評分
            
            best_grids.append({
                'grid': (cols, rows),
                'cell_size': (cell_width, cell_height),
                'content_cells': content_cells,
                'avg_coverage': avg_coverage,
                'score': grid_score
            })
    
    # 按評分排序
    best_grids.sort(key=lambda x: x['score'], reverse=True)
    
    print(f"  🏆 最佳網格候選 (前5個):")
    for i, grid_info in enumerate(best_grids[:5]):
        cols, rows = grid_info['grid']
        cw, ch = grid_info['cell_size']
        content = grid_info['content_cells']
        coverage = grid_info['avg_coverage']
        score = grid_info['score']
        
        print(f"    {i+1}. {cols}x{rows} 網格 ({cw}x{ch} 每格)")
        print(f"       有內容格子: {content}, 平均覆蓋率: {coverage:.1%}, 評分: {score:.1f}")
    
    return best_grids[:3] if best_grids else []

def analyze_content_distribution(img_array, width, height):
    """分析內容分佈模式"""
    
    print(f"\n🎨 內容分佈分析:")
    
    rgb_data = img_array[:, :, :3]
    alpha_data = img_array[:, :, 3]
    
    # 只分析有內容的像素
    content_mask = alpha_data > 0
    if np.sum(content_mask) == 0:
        print("  ⚠️ 沒有找到有內容的像素")
        return
    
    content_pixels = rgb_data[content_mask]
    
    # 分析顏色分佈
    mean_color = np.mean(content_pixels, axis=0)
    color_std = np.std(content_pixels, axis=0)
    
    print(f"  平均顏色: RGB({mean_color[0]:.0f}, {mean_color[1]:.0f}, {mean_color[2]:.0f})")
    print(f"  顏色變異: RGB({color_std[0]:.0f}, {color_std[1]:.0f}, {color_std[2]:.0f})")
    
    # 分析內容的空間分佈
    content_y, content_x = np.where(content_mask)
    
    if len(content_x) > 0:
        x_min, x_max = np.min(content_x), np.max(content_x)
        y_min, y_max = np.min(content_y), np.max(content_y)
        
        content_width = x_max - x_min + 1
        content_height = y_max - y_min + 1
        
        print(f"  內容邊界: ({x_min}, {y_min}) 到 ({x_max}, {y_max})")
        print(f"  內容尺寸: {content_width}x{content_height}")
        print(f"  佔圖片比例: {content_width/width:.1%} x {content_height/height:.1%}")
        
        # 判斷內容類型
        if content_width/width > 0.8 and content_height/height > 0.8:
            print("  💡 可能是: 單一大圖或密集網格")
        elif len(np.unique(content_x)) < width * 0.3:
            print("  💡 可能是: 垂直排列的物件")
        elif len(np.unique(content_y)) < height * 0.3:
            print("  💡 可能是: 水平排列的物件")
        else:
            print("  💡 可能是: 分散的多個物件")

def generate_corrected_usage():
    """基於重新分析生成正確的使用方式"""
    
    print(f"\n" + "="*60)
    print("💡 修正後的使用建議")
    print("="*60)
    
    print(f"🚨 重要發現:")
    print(f"  ❌ npc-in.png 不能使用與 npc.png 相同的 13x11 網格")
    print(f"  ❌ 之前的假設是錯誤的")
    print(f"  ✅ 需要根據實際結構重新配置")
    
    print(f"\n🔧 立即修正行動:")
    print(f"  1. 停止使用錯誤的網格配置")
    print(f"  2. 重新分析 npc-in.png 的真實結構")
    print(f"  3. 如果不適合做sprite sheet，考慮其他用途")
    print(f"  4. 回到 npc.png 作為主要角色資源")
    
    print(f"\n🎯 可能的正確用途:")
    print(f"  - 如果是單一圖像：作為背景或裝飾")
    print(f"  - 如果是少量物件：作為道具或家具")
    print(f"  - 如果是不同格式：需要專門的載入方式")

def main():
    """主函數"""
    
    print("🔍 重新分析 npc-in.png 的真實結構...")
    print("⚠️ 不再假設它與 npc.png 使用相同網格")
    print()
    
    success = analyze_true_structure()
    
    if success:
        generate_corrected_usage()
        print(f"\n💾 請檢查分析結果並相應調整遊戲配置")
    else:
        print(f"\n❌ 分析失敗，需要手動檢查圖片內容")

if __name__ == "__main__":
    main()