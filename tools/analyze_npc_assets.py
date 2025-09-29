#!/usr/bin/env python3
"""
分析 npc-in.png 內容並與參考遊戲畫面對比
"""

from PIL import Image
import numpy as np
import json

def analyze_npc_in_image():
    """分析 npc-in.png 的內容"""
    
    try:
        print("🔍 分析 npc-in.png...")
        img = Image.open("../static/assets/tilesets/npc-in.png")
        width, height = img.size
        
        print(f"圖片尺寸: {width}x{height}")
        print(f"色彩模式: {img.mode}")
        
        # 轉換為RGBA確保有透明度信息
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        img_array = np.array(img)
        
        # 分析透明度
        alpha_channel = img_array[:, :, 3]
        non_transparent_pixels = np.sum(alpha_channel > 0)
        total_pixels = width * height
        content_coverage = non_transparent_pixels / total_pixels
        
        print(f"內容覆蓋率: {content_coverage:.1%}")
        
        # 檢測可能的網格結構
        detect_grid_patterns(img_array, width, height)
        
        # 分析顏色分佈
        analyze_color_distribution(img_array)
        
        return {
            'size': [width, height],
            'mode': img.mode,
            'content_coverage': float(content_coverage),
            'analysis_complete': True
        }
        
    except Exception as e:
        print(f"分析 npc-in.png 時出錯: {e}")
        return None

def detect_grid_patterns(img_array, width, height):
    """檢測可能的網格模式"""
    
    print("\n🔍 檢測網格模式...")
    
    # 測試常見的網格尺寸
    common_grids = [
        (1, 1),   # 單一圖像
        (2, 2),   # 2x2
        (3, 3),   # 3x3
        (4, 4),   # 4x4
        (8, 8),   # 8x8
        (10, 10), # 10x10
        (13, 11), # 當前使用的網格
        (16, 16), # 16x16
    ]
    
    alpha_channel = img_array[:, :, 3]
    
    for cols, rows in common_grids:
        cell_width = width // cols
        cell_height = height // rows
        
        if cell_width < 10 or cell_height < 10:
            continue
            
        # 檢查每個格子的內容
        grid_analysis = []
        for row in range(rows):
            for col in range(cols):
                x1 = col * cell_width
                y1 = row * cell_height
                x2 = x1 + cell_width
                y2 = y1 + cell_height
                
                cell_alpha = alpha_channel[y1:y2, x1:x2]
                cell_coverage = np.sum(cell_alpha > 0) / (cell_width * cell_height)
                
                if cell_coverage > 0.1:  # 10%以上有內容
                    grid_analysis.append({
                        'grid': (col, row),
                        'coverage': cell_coverage,
                        'index': row * cols + col
                    })
        
        if len(grid_analysis) > 0:
            print(f"  網格 {cols}x{rows}: 找到{len(grid_analysis)}個有內容的格子")
            if len(grid_analysis) <= 10:  # 如果格子不多，顯示詳細信息
                for cell in grid_analysis[:5]:  # 只顯示前5個
                    print(f"    格子({cell['grid'][0]}, {cell['grid'][1]}): 覆蓋率{cell['coverage']:.1%}")

def analyze_color_distribution(img_array):
    """分析顏色分佈"""
    
    print("\n🎨 分析顏色分佈...")
    
    # 只分析非透明像素
    alpha_mask = img_array[:, :, 3] > 0
    rgb_pixels = img_array[alpha_mask][:, :3]
    
    if len(rgb_pixels) == 0:
        print("  沒有找到非透明內容")
        return
    
    # 計算主要顏色
    mean_color = np.mean(rgb_pixels, axis=0)
    print(f"  平均顏色: RGB({mean_color[0]:.0f}, {mean_color[1]:.0f}, {mean_color[2]:.0f})")
    
    # 檢測是否可能是角色圖像（膚色檢測）
    skin_tones = detect_skin_tones(rgb_pixels)
    if skin_tones:
        print(f"  🧑 檢測到可能的膚色區域: {skin_tones:.1%}")

def detect_skin_tones(rgb_pixels):
    """檢測膚色"""
    
    # 簡單的膚色檢測範圍
    skin_conditions = (
        (rgb_pixels[:, 0] > 95) &   # R > 95
        (rgb_pixels[:, 1] > 40) &   # G > 40  
        (rgb_pixels[:, 2] > 20) &   # B > 20
        (rgb_pixels[:, 0] > rgb_pixels[:, 1]) &  # R > G
        (rgb_pixels[:, 0] > rgb_pixels[:, 2])    # R > B
    )
    
    skin_pixel_count = np.sum(skin_conditions)
    total_pixels = len(rgb_pixels)
    
    return skin_pixel_count / total_pixels if total_pixels > 0 else 0

def compare_with_reference_game():
    """與參考遊戲畫面對比分析"""
    
    print("\n🎮 對比參考遊戲畫面...")
    
    try:
        ref_img = Image.open("../doc/game.png")
        print(f"參考遊戲畫面尺寸: {ref_img.size}")
        
        # 這裡可以進行更詳細的對比分析
        # 比如檢測角色大小、風格等
        
        print("\n💡 分析發現:")
        print("1. npc-in.png 可能包含不同的角色資源")
        print("2. 可以考慮將其作為額外的角色變化")
        print("3. 或許可以用於特定的遊戲場景")
        
    except Exception as e:
        print(f"無法讀取參考遊戲畫面: {e}")

def generate_ideas():
    """基於分析生成創意想法"""
    
    print("\n" + "="*50)
    print("💡 創意想法和建議")
    print("="*50)
    
    ideas = [
        {
            "title": "多樣化角色系統",
            "description": "將 npc-in.png 作為女性角色的專用資源，提供更多角色選擇",
            "implementation": "創建性別化的 NPC 分類，豐富角色多樣性"
        },
        {
            "title": "角色換裝系統", 
            "description": "如果 npc-in.png 包含服裝變化，可以實現角色換裝功能",
            "implementation": "讓玩家可以改變 NPC 的外觀，增加個性化"
        },
        {
            "title": "情境化角色",
            "description": "根據不同場景使用不同的角色資源",
            "implementation": "會議室用正裝、休息區用便裝等"
        },
        {
            "title": "動態角色切換",
            "description": "根據時間或事件動態切換角色外觀",
            "implementation": "早上正裝、下午休閒、加班時疲憊狀態"
        }
    ]
    
    for i, idea in enumerate(ideas, 1):
        print(f"\n{i}. 📝 {idea['title']}")
        print(f"   描述: {idea['description']}")
        print(f"   實現: {idea['implementation']}")
    
    print(f"\n🚀 推薦優先實現: 多樣化角色系統")
    print(f"   理由: 最容易實現且能立即提升遊戲豐富度")

def main():
    """主函數"""
    
    print("🔍 開始分析 NPC 資源...")
    
    # 分析 npc-in.png
    result = analyze_npc_in_image()
    
    # 與參考遊戲對比
    compare_with_reference_game()
    
    # 生成創意想法
    generate_ideas()
    
    # 保存分析結果
    if result:
        with open("../static/assets/data/npc_in_analysis.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\n💾 分析結果已保存到: ../static/assets/data/npc_in_analysis.json")

if __name__ == "__main__":
    main()