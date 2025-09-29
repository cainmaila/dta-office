export interface NPCData {
    id: string;
    name: string;
    position: string;
    personality: string;
    x: number;
    y: number;
    sprite?: string; // Legacy field, optional
    character_type?: string; // New field for character type mapping (optional for now)
    current_frame?: string; // Current animation frame state (optional for now)
    dialogue: string;
    npcType: 'desk' | 'standing' | 'meeting';
}