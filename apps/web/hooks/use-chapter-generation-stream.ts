"use client"

import { useEffect, useState, useCallback, useRef } from "react";

export interface BlockData {
    conceptTitle: string;
    blockIndex: number;
    block: any;
}

export interface GenerationState {
    currentConcept: string | null;
    currentConceptIndex: number;
    totalConcepts: number;
    blocks: BlockData[];
    errors: string[];
    progress: string[];
    isComplete: boolean;
    isGenerating: boolean;
}

export function useChapterGenerationStream(chapterId: string) {
    const [state, setState] = useState<GenerationState>({
        currentConcept: null,
        currentConceptIndex: 0,
        totalConcepts: 0,
        blocks: [],
        errors: [],
        progress: [],
        isComplete: false,
        isGenerating: false,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const startGeneration = useCallback(async () => {
        if (!chapterId || state.isGenerating) return;

        // Reset state
        setState({
            currentConcept: null,
            currentConceptIndex: 0,
            totalConcepts: 0,
            blocks: [],
            errors: [],
            progress: [],
            isComplete: false,
            isGenerating: true,
        });

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('/api/ai/course/generate-chapter-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterId }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                let currentEvent = '';

                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        currentEvent = line.substring(6).trim();
                    } else if (line.startsWith('data:')) {
                        try {
                            const data = JSON.parse(line.substring(5).trim());
                            handleEvent(currentEvent, data);
                        } catch (e) {
                            console.error('Failed to parse SSE data:', e);
                        }
                    }
                }
            }

            setState((prev) => ({ ...prev, isGenerating: false }));

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('SSE Error:', error);
                setState((prev) => ({
                    ...prev,
                    isGenerating: false,
                    errors: [...prev.errors, error.message],
                }));
            }
        }
    }, [chapterId, state.isGenerating]);

    const handleEvent = (eventType: string, data: any) => {
        setState((prev) => {
            const newState = { ...prev };

            switch (eventType) {
                case 'concept-start':
                    newState.currentConcept = data.conceptTitle;
                    newState.currentConceptIndex = data.index;
                    newState.totalConcepts = data.total;
                    newState.progress = [...prev.progress, `Starting: ${data.conceptTitle}`];
                    break;

                case 'block-complete':
                    newState.blocks = [...prev.blocks, data];
                    break;

                case 'concept-complete':
                    newState.currentConcept = null;
                    newState.progress = [...prev.progress, `Completed: ${data.conceptTitle} (${data.blocksCount} blocks)`];
                    break;

                case 'error':
                    newState.errors = [...prev.errors, `${data.conceptTitle || 'Unknown'}: ${data.error}`];
                    break;

                case 'progress':
                    newState.progress = [...prev.progress, data.message];
                    break;

                case 'complete':
                    newState.isComplete = true;
                    newState.isGenerating = false;
                    newState.progress = [...prev.progress, '✅ Generation complete!'];
                    break;
            }

            return newState;
        });
    };

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setState((prev) => ({ ...prev, isGenerating: false }));
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return { state, startGeneration, stopGeneration };
}
