#!/usr/bin/env python3
"""
分析所有NPC sprite sheets並找出正確的框架
"""

from PIL import Image
import os
import json

def analyze_sprite_sheet(image_path, name):
    """分析單個sprite sheet"""
    try:
        img = Image.open(image_path)
        width, height = img.size
        print(f"\n=== 分析 {name} ===")
        print(f"圖片尺寸: {width}x{height}")
        
        # 嘗試不同的網格配置
        possible_grids = [
            (13, 11),  # 當前使用
            (10, 10),  # 常見的10x10
            (8, 8),    # 8x8
            (12, 8),   # 12x8
            (16, 16),  # 16x16 (小框架)
            (4, 4),    # 4x4 (大框架)
        ]
        
        results = []
        for cols, rows in possible_grids:
            frame_width = width // cols
            frame_height = height // rows
            total_frames = cols * rows
            
            result = {
                'grid': f'{cols}x{rows}',
                'frame_size': f'{frame_width}x{frame_height}',
                'total_frames': total_frames,
                'cols': cols,
                'rows': rows,
                'frame_width': frame_width,
                'frame_height': frame_height
            }
            results.append(result)
            
            print(f"網格 {cols}x{rows}: {frame_width}x{frame_height} 像素/框架, 總共{total_frames}個框架")
        
        return results
        
    except Exception as e:
        print(f"分析 {name} 時出錯: {e}")
        return []

def extract_sample_frames(image_path, name, grid_config):
    """提取樣本框架進行視覺檢查"""
    try:
        img = Image.open(image_path)
        cols, rows = grid_config['cols'], grid_config['rows']
        frame_width, frame_height = grid_config['frame_width'], grid_config['frame_height']
        
        # 提取前幾個框架作為樣本
        sample_frames = []
        for i in range(min(6, cols * rows)):  # 最多6個樣本
            row = i // cols
            col = i % cols
            
            left = col * frame_width
            top = row * frame_height
            right = left + frame_width
            bottom = top + frame_height
            
            frame = img.crop((left, top, right, bottom))
            
            # 檢查框架是否主要是透明/空白
            if frame.mode == 'RGBA':
                # 檢查透明度
                alpha_channel = frame.split()[-1]
                non_transparent_pixels = sum(1 for pixel in alpha_channel.getdata() if pixel > 50)
                coverage = non_transparent_pixels / (frame_width * frame_height)
            else:
                # 對於沒有alpha通道的圖片，檢查顏色變化
                extrema = frame.getextrema()
                if len(extrema) == 3:  # RGB
                    color_range = sum(max_val - min_val for min_val, max_val in extrema)
                    coverage = min(color_range / (255 * 3), 1.0)
                else:
                    coverage = 0.5  # 預設值
            
            sample_frames.append({
                'index': i,
                'position': (col, row),
                'crop_box': (left, top, right, bottom),
                'coverage': coverage
            })
        
        return sample_frames
        
    except Exception as e:
        print(f"提取 {name} 樣本時出錯: {e}")
        return []

def main():
    sprite_files = [
        ('npc.png', 'npc-sheet'),
        ('npc-a.png', 'npc-a-sheet'), 
        ('npc-in.png', 'npc-in-sheet'),
        ('npm-b.png', 'npm-b-sheet')
    ]
    
    base_path = "../static/assets/tilesets"
    analysis_results = {}
    
    print("🔍 分析所有NPC Sprite Sheets...")
    
    for filename, sheet_name in sprite_files:
        image_path = os.path.join(base_path, filename)
        if os.path.exists(image_path):
            grid_analyses = analyze_sprite_sheet(image_path, sheet_name)
            
            # 對每種網格配置提取樣本
            for grid_config in grid_analyses[:2]:  # 只檢查前2個最可能的配置
                print(f"\n檢查 {sheet_name} 的 {grid_config['grid']} 網格配置...")
                samples = extract_sample_frames(image_path, sheet_name, grid_config)
                
                # 找出內容最豐富的框架
                best_frames = sorted(samples, key=lambda x: x['coverage'], reverse=True)[:3]
                print("最佳框架索引:")
                for frame in best_frames:
                    print(f"  框架 {frame['index']}: 位置{frame['position']}, 覆蓋率: {frame['coverage']:.2f}")
                
                grid_config['best_frames'] = best_frames
            
            analysis_results[sheet_name] = grid_analyses
    
    # 根據當前問題提供建議
    print("\n" + "="*50)
    print("🎯 基於分析的修正建議:")
    print("="*50)
    
    print("\n當前問題: 只有 npc-sheet frame 2 顯示正確")
    print("建議的修正方案:")
    
    # 為每個NPC建議最佳框架
    npc_recommendations = {
        'npc-sheet': {'name': '陳工程師', 'current_frame': 2, 'status': '✅ 正確'},
        'npc-a-sheet': {'name': '李經理', 'current_frame': 0, 'status': '❌ 需要修正'},
        'npc-in-sheet': {'name': '王設計師', 'current_frame': 1, 'status': '❌ 需要修正'},
        'npm-b-sheet': {'name': '張主管', 'current_frame': 13, 'status': '❌ 需要修正'}
    }
    
    for sheet_name, info in npc_recommendations.items():
        print(f"\n{info['name']} ({sheet_name}):")
        print(f"  當前使用: frame {info['current_frame']} - {info['status']}")
        
        if sheet_name in analysis_results and analysis_results[sheet_name]:
            best_config = analysis_results[sheet_name][0]  # 使用第一個配置
            if 'best_frames' in best_config:
                recommended_frames = [f['index'] for f in best_config['best_frames']]
                print(f"  建議嘗試: frames {recommended_frames} (基於內容覆蓋率)")
    
    # 保存分析結果
    output_path = "../static/assets/data/sprite_analysis.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analysis_results, f, indent=2, ensure_ascii=False)
    print(f"\n💾 分析結果已保存到: {output_path}")
    
    return analysis_results

if __name__ == "__main__":
    main()