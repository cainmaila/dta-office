export interface NPCData {
    id: string;
    name: string;
    position: string;
    personality: string;
    x: number;
    y: number;
    sprite: string;
    dialogue: string;
    npcType: 'desk' | 'standing' | 'meeting';
}