#!/usr/bin/env python3
"""
分析辦公室底圖布局，識別地板區域和可放置NPC的位置
"""

from PIL import Image
import json
import numpy as np

def analyze_office_background():
    """分析辦公室背景圖像"""
    
    bg_files = [
        "../static/assets/tilesets/office_bg.png",
        "../static/assets/tilesets/office_bg2.png"
    ]
    
    results = {}
    
    for bg_file in bg_files:
        try:
            print(f"\n=== 分析 {bg_file} ===")
            img = Image.open(bg_file)
            width, height = img.size
            print(f"圖片尺寸: {width}x{height}")
            
            # 轉換為numpy數組進行分析
            img_array = np.array(img)
            
            # 分析顏色分佈，識別地板區域
            # 通常地板是較深的顏色，家具/牆壁是較亮的顏色
            if len(img_array.shape) == 3:
                # RGB圖片
                gray = np.mean(img_array, axis=2)
            else:
                # 灰度圖片
                gray = img_array
            
            # 分析亮度分佈
            mean_brightness = np.mean(gray)
            std_brightness = np.std(gray)
            
            print(f"平均亮度: {mean_brightness:.1f}")
            print(f"亮度標準差: {std_brightness:.1f}")
            
            # 識別可能的地板區域（較暗的區域）
            floor_threshold = mean_brightness - 0.5 * std_brightness
            floor_mask = gray < floor_threshold
            
            # 找出地板區域的座標
            floor_coords = np.where(floor_mask)
            
            if len(floor_coords[0]) > 0:
                # 計算地板區域的邊界
                min_y, max_y = np.min(floor_coords[0]), np.max(floor_coords[0])
                min_x, max_x = np.min(floor_coords[1]), np.max(floor_coords[1])
                
                print(f"地板區域邊界:")
                print(f"  X範圍: {min_x} - {max_x}")
                print(f"  Y範圍: {min_y} - {max_y}")
                
                # 分析地板區域密度，找出適合放置NPC的位置
                floor_regions = analyze_floor_regions(floor_mask, width, height)
                
                results[bg_file] = {
                    'size': [width, height],
                    'floor_bounds': {
                        'x_min': int(min_x), 'x_max': int(max_x),
                        'y_min': int(min_y), 'y_max': int(max_y)
                    },
                    'suitable_positions': floor_regions,
                    'mean_brightness': float(mean_brightness),
                    'floor_threshold': float(floor_threshold)
                }
            
        except Exception as e:
            print(f"分析 {bg_file} 時出錯: {e}")
    
    return results

def analyze_floor_regions(floor_mask, width, height):
    """分析地板區域，找出適合放置NPC的位置"""
    
    # 將圖片分成網格，分析每個區域的地板密度
    grid_size = 64  # 64x64像素的網格
    regions = []
    
    for y in range(0, height - grid_size, grid_size):
        for x in range(0, width - grid_size, grid_size):
            # 提取網格區域
            region = floor_mask[y:y+grid_size, x:x+grid_size]
            
            # 計算地板像素比例
            floor_ratio = np.sum(region) / (grid_size * grid_size)
            
            # 如果地板比例高於某個閾值，認為適合放置NPC
            if floor_ratio > 0.6:  # 60%以上是地板
                center_x = x + grid_size // 2
                center_y = y + grid_size // 2
                
                regions.append({
                    'x': center_x,
                    'y': center_y,
                    'floor_ratio': float(floor_ratio),
                    'grid_bounds': [x, y, x+grid_size, y+grid_size]
                })
    
    # 按地板比例排序，優先選擇地板最多的區域
    regions.sort(key=lambda r: r['floor_ratio'], reverse=True)
    
    return regions[:20]  # 返回前20個最適合的位置

def suggest_npc_positions(analysis_results):
    """基於分析結果建議NPC位置"""
    
    print("\n" + "="*60)
    print("🎯 NPC位置建議")
    print("="*60)
    
    for bg_file, data in analysis_results.items():
        print(f"\n📋 {bg_file.split('/')[-1]} 的建議位置:")
        
        suitable_pos = data.get('suitable_positions', [])
        
        if len(suitable_pos) >= 4:
            # 選擇4個最佳位置給我們的4個NPC
            npc_names = ['李經理', '王設計師', '陳工程師', '張主管']
            
            print(f"  推薦的NPC位置配置:")
            
            for i, npc_name in enumerate(npc_names):
                pos = suitable_pos[i]
                print(f"    {npc_name}: x={pos['x']}, y={pos['y']} (地板比例: {pos['floor_ratio']:.1%})")
            
            # 生成TypeScript配置
            print(f"\n  💻 TypeScript配置:")
            print(f"    const npcConfigs = [")
            
            dialogues = [
                '歡迎來到我們公司！有什麼可以幫助你的嗎？',
                '我正在設計新的用戶介面，你覺得這個顏色搭配怎麼樣？',
                '今天的程式碼 review 進行得很順利，新功能快要上線了！',
                '團隊合作是我們成功的關鍵，大家都辛苦了！'
            ]
            
            for i, npc_name in enumerate(npc_names):
                pos = suitable_pos[i]
                dialogue = dialogues[i]
                print(f"        {{ name: '{npc_name}', x: {pos['x']}, y: {pos['y']}, sheet: 'npc-sheet', frame: {i}, dialogue: '{dialogue}' }},")
            
            print(f"    ];")
        else:
            print(f"  ⚠️  找到的適合位置不足: {len(suitable_pos)}個")

def main():
    """主函數"""
    print("🔍 開始分析辦公室底圖布局...")
    
    # 分析背景圖像
    results = analyze_office_background()
    
    # 建議NPC位置
    suggest_npc_positions(results)
    
    # 保存分析結果
    output_file = "../static/assets/data/office_layout_analysis.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 分析結果已保存到: {output_file}")
    
    return results

if __name__ == "__main__":
    main()