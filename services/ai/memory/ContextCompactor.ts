import { ChatMessage } from '../../../types';

export interface CompactedContext {
    foldedSummary: string;
    verbatimMessages: ChatMessage[];
    originalTurnCount: number;
    tokenEstimate: number;
    isCompacted: boolean;
}

export class ContextCompactor {
    // Keep the most recent 6 messages (3 round trips) in full verbatim detail
    public static readonly VERBATIM_TURN_COUNT = 6;
    // Trigger folding once the thread reaches 10 messages (5 round trips)
    public static readonly COMPACT_TRIGGER_MESSAGES = 10;

    /**
     * Fast heuristic token estimation (~4 characters per token for English & STEM prose)
     */
    public static estimateTokens(text: string): number {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    /**
     * Calculate total tokens across an entire chat history array
     */
    public static estimateHistoryTokens(history: ChatMessage[]): number {
        return history.reduce((sum, msg) => {
            const contentStr = typeof msg.content === 'string' 
                ? msg.content 
                : JSON.stringify(msg.content);
            return sum + this.estimateTokens(contentStr);
        }, 0);
    }

    /**
     * Determine if rolling compaction is required based on message count or token ceiling
     */
    public static shouldCompact(history: ChatMessage[]): boolean {
        if (history.length >= this.COMPACT_TRIGGER_MESSAGES) return true;
        // Also compact if token count exceeds 6,000 to protect TPM limits
        return this.estimateHistoryTokens(history) > 6000;
    }

    /**
     * Prepares optimal context: folds older messages into a digest while keeping recent messages verbatim.
     * Prevents TPM (Tokens Per Minute) exhaustion and slashes TTFT latency on Google AI Studio.
     */
    public static prepareContext(history: ChatMessage[], existingWorkingSummary?: string): CompactedContext {
        const totalEstimatedTokens = this.estimateHistoryTokens(history);

        if (!this.shouldCompact(history)) {
            return {
                foldedSummary: existingWorkingSummary || '',
                verbatimMessages: history,
                originalTurnCount: history.length,
                tokenEstimate: totalEstimatedTokens,
                isCompacted: false
            };
        }

        // Split history into older messages to compress and recent messages to keep verbatim
        const splitIndex = Math.max(0, history.length - this.VERBATIM_TURN_COUNT);
        const olderMessages = history.slice(0, splitIndex);
        const recentMessages = history.slice(splitIndex);

        // Extract key topics and intents from older turns
        const olderUserQueries: string[] = [];
        const olderAssistantHighlights: string[] = [];

        for (const msg of olderMessages) {
            if (msg.role === 'user' && typeof msg.content === 'string') {
                const cleanQuery = msg.content
                    .replace(/\[\d+ Images.*?\]/g, '')
                    .replace(/\[Audio Uploaded\]/g, '')
                    .trim();
                if (cleanQuery) {
                    olderUserQueries.push(cleanQuery.length > 80 ? cleanQuery.slice(0, 80) + '...' : cleanQuery);
                }
            } else if (msg.role === 'model' && typeof msg.content === 'string') {
                // Grab first sentence or headline from assistant response
                const firstLine = msg.content
                    .split('\n')[0]
                    .replace(/[#*`]/g, '')
                    .trim();
                if (firstLine && firstLine.length > 10 && !firstLine.startsWith('<div')) {
                    olderAssistantHighlights.push(firstLine.length > 70 ? firstLine.slice(0, 70) + '...' : firstLine);
                }
            }
        }

        const lines: string[] = [];
        if (existingWorkingSummary) {
            lines.push(existingWorkingSummary);
        }
        if (olderUserQueries.length > 0) {
            lines.push(`- Earlier student questions: ${olderUserQueries.join('; ')}`);
        }
        if (olderAssistantHighlights.length > 0) {
            lines.push(`- Addressed topics: ${olderAssistantHighlights.slice(-3).join('; ')}`);
        }

        const foldedSummary = lines.length > 0 
            ? `[THREAD WORKING CONTEXT (Earlier ${olderMessages.length} turns folded)]:\n${lines.join('\n')}`
            : '';

        const compactedTokens = this.estimateTokens(foldedSummary) + this.estimateHistoryTokens(recentMessages);

        return {
            foldedSummary,
            verbatimMessages: recentMessages,
            originalTurnCount: history.length,
            tokenEstimate: compactedTokens,
            isCompacted: true
        };
    }
}
