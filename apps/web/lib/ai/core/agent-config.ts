import type { AIConfig } from "../model-factory";

/**
 * Agent-specific model configuration
 * Allows you to assign different models to different agents
 */
export const AGENT_MODELS: Record<string, AIConfig> = {
    // Director Agent - Plans content structure
    director: {
        provider: "google",
        // model: "gemini-2.0-flash",
        model: "gemini-2.5-pro",
    },

    // Professor Agent - Generates text content
    professor: {
        provider: "google",
        model: "gemini-2.0-flash",
    },

    // visualizer: {
    //     provider: "anthropic",
    //     model: "claude-haiku-4-5",
    // },

    visualizer: {
        provider: "google",
        model: "gemini-2.0-flash",
    },

    // Inquisitor Agent - Generates quiz questions
    inquisitor: {
        provider: "google",
        model: "gemini-2.0-flash",
    },

    reviewer: {
        provider: "google",
        model: "gemini-2.5-pro",
    },
};

/**
 * Get model configuration for a specific agent
 * Falls back to default if agent not configured
 */
export function getAgentModel(agentName: string): AIConfig {
    return AGENT_MODELS[agentName] || {
        provider: "google",
        model: "gemini-2.0-flash",
    };
}
