import { LlmTaskCategory } from "../../types";

export interface AIModel {
    id: string;
    name: string;
    provider: 'google' | 'groq' | 'openrouter' | 'mistral' | 'cerebras' | 'cloudflare';
    description: string;
    contextWindow: number;
    isFree?: boolean;
    supportsVision?: boolean;
    supportsJson?: boolean;
    costCategory: 'free' | 'low' | 'medium' | 'high';
    icon?: string;
}

export const MODEL_REGISTRY: AIModel[] = [
    // --- TIER 1: GOOGLE AI STUDIO NATIVE (Primary) ---
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'google', description: '20 RPD | 5 RPM | 250K TPM. Next-gen flagship multimodal & hybrid reasoning (Latest).', contextWindow: 1000000, isFree: true, supportsVision: true, supportsJson: true, costCategory: 'free', icon: '⚡' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', provider: 'google', description: '500 RPD | 15 RPM | 250K TPM. High efficiency workhorse.', contextWindow: 1000000, isFree: true, supportsVision: true, supportsJson: true, costCategory: 'free', icon: '⚡' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', provider: 'google', description: '20 RPD | 5 RPM | 250K TPM. Cutting-edge hybrid reasoning & vision.', contextWindow: 1000000, isFree: true, supportsVision: true, supportsJson: true, costCategory: 'free', icon: '⚡' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'google', description: '20 RPD | 5 RPM | 250K TPM. Advanced multimodal intelligence.', contextWindow: 1000000, isFree: true, supportsVision: true, supportsJson: true, costCategory: 'free', icon: '🚀' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', provider: 'google', description: '20 RPD | 5 RPM | 250K TPM. Advanced reasoning & analysis.', contextWindow: 1000000, isFree: true, supportsVision: true, supportsJson: true, costCategory: 'free', icon: '🧠' },
    { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'google', description: '20 RPD | 5 RPM | 250K TPM. Multimodal reasoning.', contextWindow: 1000000, isFree: true, supportsVision: true, supportsJson: true, costCategory: 'free', icon: '⚡' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'google', description: '500 RPD | 15 RPM | 250K TPM. Fast fallback.', contextWindow: 1000000, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🐇' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', description: '20 RPD | 5 RPM | 250K TPM. Multimodal reasoning workhorse.', contextWindow: 1000000, isFree: true, supportsVision: true, supportsJson: true, costCategory: 'free', icon: '⚡' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'google', description: '20 RPD | 10 RPM | 250K TPM. Lightweight reasoning.', contextWindow: 1000000, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🐇' },
    { id: 'gemma-4-26b', name: 'Gemma 4 26B', provider: 'google', description: '14,400 RPD | 30 RPM | 16K TPM. Massive daily quota for routine tasks.', contextWindow: 16384, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '💎' },
    { id: 'gemma-4-31b', name: 'Gemma 4 31B', provider: 'google', description: '14,400 RPD | 30 RPM | 16K TPM. High quota open weights model.', contextWindow: 16384, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '💎' },

    // --- TIER 2: GROQ (Ultra-Fast Inference & Instant Quota) ---
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Groq)', provider: 'groq', description: '14,400 RPD | 30 RPM | 500K TPD. Instant response (<200ms) for UI & quotes.', contextWindow: 128000, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '⚡' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', provider: 'groq', description: '1,000 RPD | 30 RPM | 100K TPD. GPT-4 class ultra-fast reasoning.', contextWindow: 32768, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🏎️' },
    { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B (Groq)', provider: 'groq', description: '1,000 RPD | 30 RPM | 200K TPD. Advanced open reasoning.', contextWindow: 32768, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🐉' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill (Groq)', provider: 'groq', description: '1,000 RPD | 30 RPM. Strong reasoning & 5-Whys causal analysis.', contextWindow: 128000, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🧠' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Groq)', provider: 'groq', description: '1,000 RPD | 30 RPM | 200K TPD. High capacity open model.', contextWindow: 131072, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🤖' },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Groq)', provider: 'groq', description: '1,000 RPD | 30 RPM | 200K TPD. Compact fast model.', contextWindow: 131072, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🤖' },

    // --- TIER 3: OPENROUTER FREE AGGREGATOR ---
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', provider: 'openrouter', description: 'Top-tier reasoning on OpenRouter.', contextWindow: 64000, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🐳' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)', provider: 'openrouter', description: 'OpenRouter Llama 3.3 70B.', contextWindow: 65536, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🦙' },
    { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen3 Next 80B Instruct (Free)', provider: 'openrouter', description: 'OpenRouter Qwen3 80B.', contextWindow: 262144, isFree: true, supportsVision: false, supportsJson: true, costCategory: 'free', icon: '🟣' }
];

// Optimized Task Allocation Matrix (Cognitive Intelligence vs Speed vs Daily Quota)
export const TASK_DEFAULTS: Record<LlmTaskCategory, string[]> = {
    // 1. General Chat (Balanced IQ & Quota)
    chat_general: [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'gemma-4-31b'
    ], 

    // 2. Deep Analysis (Dashboard Reports)
    analysis_deep: [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'llama-3.3-70b-versatile',
        'qwen/qwen3.6-27b',
        'deepseek-r1-distill-llama-70b'
    ],

    // 3. Root Cause Analysis (5-Whys Causal Reasoning)
    analysis_root_cause: [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'deepseek-r1-distill-llama-70b',
        'llama-3.3-70b-versatile',
        'gemini-3.5-flash-lite',
        'gemini-3.7-flash',
        'gemini-3.6-flash'
    ],

    // 4. Executive Briefing
    analysis_briefing: [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'llama-3.3-70b-versatile',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'qwen/qwen3.6-27b'
    ],

    // 5. Routine Planning (Daily Schedule)
    planning_routine: [
        'gemini-3.5-flash-lite',
        'llama-3.1-8b-instant',
        'gemma-4-26b',
        'gemini-3.8-flash'
    ],

    // 6. Sorting & Optimization (Smart Sort)
    planning_sorting: [
        'gemini-3.5-flash-lite',
        'llama-3.1-8b-instant',
        'gemma-4-26b',
        'gemini-3.8-flash'
    ],

    // 7. Creative Writing (Daily Quotes, Persona) - Ultra Fast Groq Focus (14.4k RPD)
    creative_writing: [
        'gemini-3.5-flash-lite',
        'llama-3.1-8b-instant',
        'gemma-4-26b',
        'llama-3.3-70b-versatile',
        'gemini-3.8-flash'
    ],

    // 8. STEM Core (Math/Physics Solving)
    stem_core: [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'deepseek-r1-distill-llama-70b',
        'llama-3.3-70b-versatile',
        'gemini-3.5-flash-lite',
        'gemini-3.7-flash',
        'gemini-3.6-flash'
    ],

    // 9. Flashcard Generation (Error Vaccinator)
    flashcard_gen: [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'llama-3.3-70b-versatile',
        'gemini-3.5-flash',
        'deepseek-r1-distill-llama-70b',
        'gemini-3.7-flash',
        'gemini-3.6-flash'
    ],

    // 10. Technical Ops (Data Cleaning & Tags)
    technical_ops: [
        'gemini-3.5-flash-lite',
        'gemma-4-26b',
        'llama-3.1-8b-instant',
        'gemini-3.8-flash'
    ],

    // 11. OCR Image Processing
    ocr_extraction: [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash'
    ]
};

export const getModelById = (id: string): AIModel | undefined => {
    return MODEL_REGISTRY.find(m => m.id === id);
};
