#!/usr/bin/env python3
"""
移除 characters.json 中的敏感欄位 (personality, introduction)
避免在前端暴露角色性格設定
"""

import json
import os

def remove_sensitive_fields(input_file, output_file):
    """
    從 characters.json 移除 personality 和 introduction 欄位
    """
    print(f"讀取檔案: {input_file}")

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 移除每個角色的 personality 和 introduction 欄位
    removed_count = 0
    for character in data.get('characters', []):
        fields_removed = []
        if 'personality' in character:
            del character['personality']
            fields_removed.append('personality')
        if 'introduction' in character:
            del character['introduction']
            fields_removed.append('introduction')

        if fields_removed:
            removed_count += 1
            print(f"  ✓ {character['name']} ({character['id']}): 移除 {', '.join(fields_removed)}")

    # 寫入檔案
    print(f"\n寫入檔案: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"\n✅ 完成！共處理 {removed_count} 個角色")
    print(f"   保留欄位: id, name, position, dialogue")
    print(f"   移除欄位: personality, introduction")

if __name__ == '__main__':
    # 檔案路徑
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    input_file = os.path.join(project_root, 'static/assets/data/characters.json')
    output_file = input_file  # 直接覆蓋原檔案

    # 備份原檔案
    backup_file = input_file + '.backup'
    print(f"📦 建立備份: {backup_file}")
    with open(input_file, 'r', encoding='utf-8') as f_in:
        with open(backup_file, 'w', encoding='utf-8') as f_out:
            f_out.write(f_in.read())

    # 處理檔案
    remove_sensitive_fields(input_file, output_file)

    print(f"\n💡 提示: 如需還原，備份檔案位於: {backup_file}")
