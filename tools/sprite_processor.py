#!/usr/bin/env python3
"""
NPC Sprite Sheet Processor
Analyzes and processes the NPC sprite sheet to create a proper asset library
"""

import json
from PIL import Image, ImageDraw
import os
import sys

def analyze_sprite_sheet(image_path):
    """Analyze the sprite sheet structure"""
    try:
        img = Image.open(image_path)
        print(f"Image size: {img.size}")
        print(f"Image mode: {img.mode}")
        
        # Basic grid analysis assuming 13x11 as mentioned in code
        width, height = img.size
        grid_cols = 13
        grid_rows = 11
        
        cell_width = width // grid_cols
        cell_height = height // grid_rows
        
        print(f"Grid analysis: {grid_cols}x{grid_rows}")
        print(f"Cell size: {cell_width}x{cell_height}")
        
        return {
            'image_size': img.size,
            'grid_cols': grid_cols,
            'grid_rows': grid_rows,
            'cell_size': (cell_width, cell_height),
            'total_frames': grid_cols * grid_rows
        }
        
    except Exception as e:
        print(f"Error analyzing sprite sheet: {e}")
        return None

def extract_sprite_frames(image_path, output_dir, analysis):
    """Extract individual sprite frames from the sheet"""
    try:
        img = Image.open(image_path)
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        cell_width, cell_height = analysis['cell_size']
        grid_cols, grid_rows = analysis['grid_cols'], analysis['grid_rows']
        
        frames = []
        
        for row in range(grid_rows):
            for col in range(grid_cols):
                # Calculate crop box
                left = col * cell_width
                top = row * cell_height
                right = left + cell_width
                bottom = top + cell_height
                
                # Extract frame
                frame = img.crop((left, top, right, bottom))
                frame_number = row * grid_cols + col
                
                # Save frame
                frame_path = os.path.join(output_dir, f"npc_frame_{frame_number:03d}.png")
                frame.save(frame_path)
                
                frames.append({
                    'frame_id': frame_number,
                    'grid_pos': [col, row],
                    'crop_box': [left, top, right, bottom],
                    'file_path': frame_path
                })
        
        print(f"Extracted {len(frames)} frames to {output_dir}")
        return frames
        
    except Exception as e:
        print(f"Error extracting frames: {e}")
        return None

def create_sprite_atlas_config(frames, analysis):
    """Create a sprite atlas configuration for Phaser"""
    
    atlas_config = {
        "textures": [{
            "image": "npc.png",
            "format": "RGBA8888",
            "size": {
                "w": analysis['image_size'][0],
                "h": analysis['image_size'][1]
            },
            "scale": 1,
            "frames": {}
        }]
    }
    
    cell_width, cell_height = analysis['cell_size']
    
    # Add frame definitions
    for frame in frames:
        frame_id = f"npc_{frame['frame_id']:03d}"
        left, top, right, bottom = frame['crop_box']
        
        atlas_config["textures"][0]["frames"][frame_id] = {
            "frame": {
                "x": left,
                "y": top,
                "w": cell_width,
                "h": cell_height
            },
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {
                "x": 0,
                "y": 0,
                "w": cell_width,
                "h": cell_height
            },
            "sourceSize": {
                "w": cell_width,
                "h": cell_height
            }
        }
    
    return atlas_config

def create_npc_character_definitions():
    """Create NPC character definitions with frame mappings"""
    
    # Define character types and their typical frame assignments
    characters = {
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
        },
        "casual_male_1": {
            "description": "男性休閒服裝角色 1",
            "frames": {
                "idle": [6, 7, 8],
                "walking": [21, 22, 23, 24],
                "sitting": [30, 31],
                "talking": [45, 46, 47]
            },
            "recommended_for": ["工程師", "實習生", "技術員"]
        },
        "casual_female_1": {
            "description": "女性休閒服裝角色 1", 
            "frames": {
                "idle": [9, 10, 11],
                "walking": [25, 26, 27, 28],
                "sitting": [32, 33],
                "talking": [48, 49, 50]
            },
            "recommended_for": ["設計師", "助理", "專員"]
        }
    }
    
    return characters

def main():
    # Configuration
    sprite_sheet_path = "../static/assets/tilesets/npc.png"
    output_dir = "../static/assets/sprites/npc_frames"
    config_output_dir = "../static/assets/data"
    
    print("🎮 NPC Sprite Processor Starting...")
    
    # Analyze sprite sheet
    print("\n📊 Analyzing sprite sheet...")
    analysis = analyze_sprite_sheet(sprite_sheet_path)
    if not analysis:
        print("❌ Failed to analyze sprite sheet")
        return 1
    
    # Extract frames (optional - for debugging)
    # print("\n✂️ Extracting sprite frames...")
    # frames = extract_sprite_frames(sprite_sheet_path, output_dir, analysis)
    
    # Create atlas configuration
    print("\n🗺️ Creating sprite atlas configuration...")
    frames = []
    for i in range(analysis['total_frames']):
        row = i // analysis['grid_cols']
        col = i % analysis['grid_cols']
        left = col * analysis['cell_size'][0]
        top = row * analysis['cell_size'][1]
        right = left + analysis['cell_size'][0]
        bottom = top + analysis['cell_size'][1]
        frames.append({
            'frame_id': i,
            'grid_pos': [col, row],
            'crop_box': [left, top, right, bottom]
        })
    
    atlas_config = create_sprite_atlas_config(frames, analysis)
    
    # Create character definitions
    print("\n👥 Creating NPC character definitions...")
    characters = create_npc_character_definitions()
    
    # Save configurations
    if not os.path.exists(config_output_dir):
        os.makedirs(config_output_dir)
    
    # Save atlas configuration
    atlas_path = os.path.join(config_output_dir, "npc_atlas.json")
    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas_config, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved atlas configuration to {atlas_path}")
    
    # Save character definitions
    characters_path = os.path.join(config_output_dir, "npc_characters.json")
    with open(characters_path, 'w', encoding='utf-8') as f:
        json.dump(characters, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved character definitions to {characters_path}")
    
    # Create updated NPC data with proper frame references
    updated_npc_data = {
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
            },
            {
                "id": "npc_002", 
                "name": "王設計師",
                "position": "UI/UX設計師",
                "personality": "創意滿滿",
                "x": 500,
                "y": 350,
                "character_type": "business_suit_female_1",
                "current_frame": "idle",
                "dialogue": "我正在設計新的用戶介面，你覺得這個顏色搭配怎麼樣？",
                "npcType": "desk"
            },
            {
                "id": "npc_003",
                "name": "陳工程師",
                "position": "前端工程師", 
                "personality": "技術專精",
                "x": 700,
                "y": 450,
                "character_type": "casual_male_1",
                "current_frame": "idle",
                "dialogue": "今天的程式碼 review 進行得很順利，新功能快要上線了！",
                "npcType": "desk"
            },
            {
                "id": "npc_004",
                "name": "張主管",
                "position": "技術主管",
                "personality": "領導風範",
                "x": 200,
                "y": 250,
                "character_type": "business_suit_male_1",
                "current_frame": "idle",
                "dialogue": "團隊合作是我們成功的關鍵，大家都辛苦了！",
                "npcType": "standing"
            },
            {
                "id": "npc_005",
                "name": "林助理",
                "position": "行政助理",
                "personality": "親切熱心",
                "x": 150,
                "y": 300,
                "character_type": "casual_female_1",
                "current_frame": "idle",
                "dialogue": "需要什麼協助嗎？我可以幫你安排會議室或準備資料。",
                "npcType": "standing"
            }
        ]
    }
    
    # Save updated NPC data
    npc_data_path = os.path.join(config_output_dir, "npcs_updated.json")
    with open(npc_data_path, 'w', encoding='utf-8') as f:
        json.dump(updated_npc_data, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved updated NPC data to {npc_data_path}")
    
    print("\n✅ NPC Sprite Processing Complete!")
    print("\nNext steps:")
    print("1. Update the Game.ts to use the new atlas configuration")
    print("2. Update NPCTypes.ts to include character_type field")
    print("3. Update NPC.ts class to use character definitions")
    print("4. Test the new sprite system")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())