/**
 * NPC 樣式系統使用指南
 *
 * 這個檔案展示如何使用 NPC 樣式系統來切換角色造型和動作
 */

import { NPCManager } from "../managers/NPCManager";
import { getAllStyles, getRecommendedStyles } from "../data/npcStyles";

/**
 * 使用範例 1: 在 Game Scene 中切換 NPC 樣式
 */
export function exampleChangeNPCStyle(npcManager: NPCManager) {
    // 將李經理改成休閒男性造型
    npcManager.setNPCStyle("npc_001", "casual_male_1", "idle");

    // 將王設計師改成商務女性，並設定為說話狀態
    npcManager.setNPCStyle("npc_002", "business_female_1", "talking");
}

/**
 * 使用範例 2: 切換 NPC 動作狀態
 */
export function exampleChangeNPCAction(npcManager: NPCManager) {
    // 讓李經理從站立變成坐著
    npcManager.setNPCAction("npc_001", "sitting");

    // 讓王設計師開始走路
    npcManager.setNPCAction("npc_002", "walking");
}

/**
 * 使用範例 3: 播放 NPC 動畫
 */
export function examplePlayNPCAnimation(npcManager: NPCManager) {
    // 讓李經理播放說話動畫（循環播放所有說話幀）
    npcManager.playNPCAnimation("npc_001", "talking", 300);

    // 讓王設計師播放走路動畫
    npcManager.playNPCAnimation("npc_002", "walking", 200);
}

/**
 * 使用範例 4: 根據職位獲取推薦樣式
 */
export function exampleGetRecommendedStyles() {
    // 為「經理」職位獲取推薦樣式
    const stylesForManager = getRecommendedStyles("經理");
    console.log("經理推薦樣式:", stylesForManager);
    // 結果: business_male_1, business_female_1

    // 為「工程師」職位獲取推薦樣式
    const stylesForEngineer = getRecommendedStyles("工程師");
    console.log("工程師推薦樣式:", stylesForEngineer);
    // 結果: casual_male_1
}

/**
 * 使用範例 5: 獲取所有可用樣式
 */
export function exampleGetAllStyles() {
    const allStyles = getAllStyles();
    console.log("所有可用樣式:");
    allStyles.forEach((style) => {
        console.log(`- ${style.name} (${style.id})`);
        console.log(`  描述: ${style.description}`);
        console.log(`  適合職位: ${style.recommendedFor.join(", ")}`);
    });
}

/**
 * 使用範例 6: 直接操作 NPC 物件
 */
export function exampleDirectNPCControl(npcManager: NPCManager) {
    const npc = npcManager.getNPC("npc_001");
    if (npc) {
        // 切換樣式
        npc.setStyle("business_male_1", "idle");

        // 切換動作
        npc.setAction("talking");

        // 播放動畫
        npc.playActionAnimation("walking", 250);

        // 獲取當前樣式資訊
        const currentStyle = npc.getCurrentStyle();
        console.log("當前樣式:", currentStyle?.name);

        // 獲取當前動作
        const currentAction = npc.getCurrentAction();
        console.log("當前動作:", currentAction);
    }
}

/**
 * 使用範例 7: 在 Game Scene 中添加互動式樣式選擇器
 * 這個範例展示如何讓玩家點擊按鈕切換 NPC 造型
 */
export function exampleCreateStyleSelector(
    scene: Phaser.Scene,
    npcManager: NPCManager
) {
    const styles = getAllStyles();
    let currentStyleIndex = 0;

    // 創建切換按鈕
    const switchButton = scene.add.text(50, 50, "切換造型", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#4CAF50",
        padding: { x: 15, y: 10 },
    });

    switchButton.setInteractive({ useHandCursor: true });

    switchButton.on("pointerdown", () => {
        // 循環切換樣式
        currentStyleIndex = (currentStyleIndex + 1) % styles.length;
        const newStyle = styles[currentStyleIndex];

        // 將第一個 NPC 切換到新樣式
        npcManager.setNPCStyle("npc_001", newStyle.id, "idle");

        console.log(`已切換到: ${newStyle.name}`);
    });

    // 創建動作切換按鈕
    const actions: Array<"idle" | "walking" | "sitting" | "talking"> = [
        "idle",
        "walking",
        "sitting",
        "talking",
    ];
    let currentActionIndex = 0;

    const actionButton = scene.add.text(50, 100, "切換動作", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#2196F3",
        padding: { x: 15, y: 10 },
    });

    actionButton.setInteractive({ useHandCursor: true });

    actionButton.on("pointerdown", () => {
        currentActionIndex = (currentActionIndex + 1) % actions.length;
        const newAction = actions[currentActionIndex];

        npcManager.setNPCAction("npc_001", newAction);
        console.log(`已切換動作: ${newAction}`);
    });
}

/**
 * 在 npcs.json 中配置樣式的範例
 *
 * {
 *   "id": "npc_001",
 *   "name": "李經理",
 *   "position": "產品經理",
 *   "x": 300,
 *   "y": 400,
 *   "styleId": "business_male_1",  // 指定樣式 ID
 *   "action": "idle",               // 指定動作狀態
 *   "dialogue": "歡迎來到我們公司！",
 *   "npcType": "standing"
 * }
 */
