
export interface FlashcardData {
    id: string;
    front: string;
    back: string;
    explanation?: string;
    type: 'basic' | 'code' | 'math' | 'concept';
    due: string;
    stability: number;
    difficulty: number;
    state: number;
    reps: number;
    lapses: number;
    chapter?: { title: string; id: string };
    chapterId?: string;
    conceptId: string;
}

export interface DeckInfo {
    id: string;
    name: string;
    cards: FlashcardData[];
    dueCount: number;
    newCount: number;
    totalCount: number;
    color: string;
    isMaster?: boolean;
}