import { GoogleGenAI } from "@google/genai";
import { AiAssistantPreferences, LlmTaskCategory } from "../../types";
import { TASK_DEFAULTS, getModelById } from "./models";
import { generateTextOpenAI } from "./providers";
import { KeyPoolManager, AIProviderName } from "./keyPool";
import { QuotaTracker } from "./quotaTracker";
import { logger } from "../Logger";

interface GenerationOptions {
    task: LlmTaskCategory;
    prompt: string;
    systemInstruction?: string;
    jsonSchema?: any;
    expectJson?: boolean;
    userPreferences: AiAssistantPreferences;
    googleApiKey: string;
    includeFooter?: boolean;
    fallbackFrom?: string;
    chatHistory?: { role: 'user' | 'model', content: string }[];
}

export const llmPipeline = async (options: GenerationOptions): Promise<string> => {
    const { task, prompt, systemInstruction, jsonSchema, expectJson, userPreferences, googleApiKey, includeFooter, fallbackFrom, chatHistory } = options;
    const keyPool = KeyPoolManager.getInstance();
    const quotaTracker = QuotaTracker.getInstance();

    // 1. Determine Candidate Models
    const candidates: string[] = [];

    if (userPreferences.modelOverrides?.[task]) {
        candidates.push(userPreferences.modelOverrides[task]!);
    }

    if (userPreferences.model && !candidates.includes(userPreferences.model)) {
        candidates.push(userPreferences.model);
    }

    TASK_DEFAULTS[task].forEach(m => {
        if (!candidates.includes(m)) candidates.push(m);
    });

    if (!candidates.includes('gemini-3.5-flash-lite')) {
        candidates.push('gemini-3.5-flash-lite');
    }

    const primaryModel = candidates[0];
    let lastError: Error | null = null;
    let usedModelId: string | null = null;
    let resultText = "";

    // 2. Iterate and Try Candidate Models
    for (const modelId of candidates) {
        if (quotaTracker.isExhausted(modelId)) {
            logger.debug(`[LLM Pipeline] Skipping ${modelId}: Model quota marked exhausted.`, undefined, 'LLM');
            continue;
        }

        const modelDef = getModelById(modelId);
        const isImplicitGoogle = !modelDef && (modelId.includes('gemini') || modelId.includes('gemma'));
        const providerStr = modelDef ? modelDef.provider : (isImplicitGoogle ? 'google' : null);

        if (!providerStr) continue;
        const provider = providerStr as AIProviderName;

        // Auto-sync raw user preference keys into key pool if pool is unpopulated
        if (keyPool.getKeys(provider).length === 0) {
            if (provider === 'google' && googleApiKey) keyPool.setKeys('google', googleApiKey);
            else if (provider === 'groq' && userPreferences.groqApiKey) keyPool.setKeys('groq', userPreferences.groqApiKey);
            else if (provider === 'openrouter' && userPreferences.openRouterApiKey) keyPool.setKeys('openrouter', userPreferences.openRouterApiKey);
        }

        // Inner loop: Try all active API keys for this provider/model before moving to next candidate model
        const poolKeys = keyPool.getKeys(provider);
        const maxKeyAttempts = Math.max(1, poolKeys.length);
        let modelSuccess = false;

        for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
            let currentApiKey = keyPool.getNextKey(provider);
            if (!currentApiKey) {
                if (provider === 'google') currentApiKey = googleApiKey?.split(/[\n,;]+/)[0]?.trim();
                else if (provider === 'groq') currentApiKey = userPreferences.groqApiKey?.split(/[\n,;]+/)[0]?.trim() || '';
                else if (provider === 'openrouter') currentApiKey = userPreferences.openRouterApiKey?.split(/[\n,;]+/)[0]?.trim() || '';
            }

            if (!currentApiKey) {
                logger.warn(`[LLM Pipeline] Skipping ${modelId}: Missing API Key for ${provider}`, undefined, 'LLM');
                lastError = new Error(`Missing API Key for ${provider}`);
                break;
            }

            const startTime = Date.now();
            try {
                logger.debug(`[LLM Pipeline] Executing ${task} via ${modelId} (${provider}) [Key Attempt ${keyAttempt + 1}/${maxKeyAttempts}]...`, undefined, 'LLM');
                
                if (provider === 'google') {
                    const ai = new GoogleGenAI({ apiKey: currentApiKey });
                    const config: any = {};
                    
                    const isGemma = modelId.toLowerCase().includes('gemma');
                    let finalContents: any[] = [];
                    
                    if (isGemma && systemInstruction) {
                        finalContents = [{ role: 'user', parts: [{ text: `SYSTEM: ${systemInstruction}\n\nUSER: ${prompt}` }] }];
                    } else {
                        if (systemInstruction) config.systemInstruction = systemInstruction;
                        finalContents = [{ role: 'user', parts: [{ text: prompt }] }];
                    }
                    
                    if (jsonSchema) {
                        config.responseMimeType = "application/json";
                        config.responseSchema = jsonSchema;
                    } else if (expectJson) {
                        config.responseMimeType = "application/json";
                    }

                    const response = await ai.models.generateContent({
                        model: modelId,
                        contents: finalContents,
                        config: config
                    });
                    
                    resultText = response.text || "";
                    usedModelId = modelId;

                    keyPool.recordLatency(provider, currentApiKey, Date.now() - startTime);
                    quotaTracker.trackCall(modelId);
                    modelSuccess = true;
                    break;

                } else {
                    let openAiInput: any = prompt;
                    if (chatHistory && chatHistory.length > 0) {
                        openAiInput = [
                            ...chatHistory.map(msg => {
                                let textContent = '';
                                if (typeof msg.content === 'string') {
                                    textContent = msg.content.replace(/\n\n<div class="text-\[10px\].*?<\/div>/g, '');
                                } else {
                                    textContent = JSON.stringify(msg.content);
                                }
                                return { role: msg.role === 'model' ? 'assistant' : 'user', content: textContent };
                            }),
                            { role: 'user', content: prompt }
                        ];
                    }

                    const result = await generateTextOpenAI(
                        provider as any,
                        currentApiKey,
                        modelId,
                        openAiInput,
                        systemInstruction,
                        expectJson || !!jsonSchema
                    );
                    
                    resultText = result;
                    usedModelId = modelId;

                    keyPool.recordLatency(provider, currentApiKey, Date.now() - startTime);
                    quotaTracker.trackCall(modelId);
                    modelSuccess = true;
                    break;
                }

            } catch (e: any) {
                const errMessage = e.message || String(e);
                logger.warn(`[LLM Pipeline] ${modelId} (${provider}) failed on key attempt ${keyAttempt + 1}: ${errMessage}`, undefined, 'LLM');
                
                if (errMessage.includes("429") || errMessage.includes("quota") || errMessage.includes("EXHAUSTED") || errMessage.includes("LIMIT")) {
                    keyPool.markKeyExhausted(provider, currentApiKey);
                } else if (errMessage.includes("503") || errMessage.includes("overloaded") || errMessage.includes("busy") || errMessage.includes("RESOURCE_EXHAUSTED")) {
                    logger.warn(`[LLM Pipeline] Model ${modelId} reported overloaded/busy. Fast-failing over to next candidate model.`, undefined, 'LLM');
                    quotaTracker.markExhausted(modelId, 5 * 60 * 1000);
                } else if (errMessage.includes("API_KEY_INVALID") || errMessage.includes("API key not valid") || errMessage.includes("400") || errMessage.includes("403")) {
                    // Mark invalid key exhausted for 24h to avoid spamming rejected API calls
                    keyPool.markKeyExhausted(provider, currentApiKey, 24 * 60 * 60 * 1000);
                }
                lastError = e;
            }
        }

        if (modelSuccess) {
            break;
        } else {
            quotaTracker.markExhausted(modelId);
        }
    }

    if (!usedModelId) {
        throw new Error(`All AI models failed for task '${task}'. Please check API keys in Settings. Last error: ${lastError?.message}`);
    }

    if (includeFooter && !expectJson && !jsonSchema && usedModelId) {
        const modelDef = getModelById(usedModelId);
        const modelName = modelDef ? modelDef.name : usedModelId;
        
        let footerHtml = '';
        if (fallbackFrom && fallbackFrom !== 'none') {
             const fallbackDef = getModelById(fallbackFrom);
             const fallbackName = fallbackDef ? fallbackDef.name : fallbackFrom;
             footerHtml = `\n\n---\n<footer class="text-xs text-gray-500 mt-6 pt-2 border-t border-gray-700/50 flex items-center gap-1"><span class="text-amber-500">⚠️</span> Fallback to <strong>${modelName}</strong> <span class="text-gray-500">(${fallbackName} unavailable)</span></footer>`;
        } else if (usedModelId === primaryModel || primaryModel === 'none') {
             footerHtml = `\n\n---\n<footer class="text-xs text-gray-500 mt-6 pt-2 border-t border-gray-700/50 flex items-center gap-1"><span>⚡</span> Generated by <strong>${modelName}</strong></footer>`;
        } else {
             const primaryDef = getModelById(primaryModel);
             const primaryName = primaryDef ? primaryDef.name : primaryModel;
             const errorMsg = lastError ? ` - ${lastError.message}` : '';
             footerHtml = `\n\n---\n<footer class="text-xs text-gray-500 mt-6 pt-2 border-t border-gray-700/50 flex items-center gap-1"><span class="text-amber-500">⚠️</span> Fallback to <strong>${modelName}</strong> <span class="text-gray-500">(${primaryName} unavailable${errorMsg})</span></footer>`;
        }
        
        resultText += footerHtml;
    }

    return resultText;
};