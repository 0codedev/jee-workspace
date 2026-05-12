
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Blob as GenAiBlob, Modality, HarmBlockThreshold, HarmCategory, ThinkingLevel } from "@google/genai";
import { QuestionStatus, type TestReport, type QuestionLog, type AiFilter, type ChatMessage, type StudyGoal, type AiAssistantPreferences, type GenUIToolType, type GenUIComponentData, type UserProfile, type LlmTaskCategory } from '../types';
import { retrieveRelevantContext, formatFullHistoryContext, GENUI_TOOLS, decodeAudioData, encodeAudio, decodeAudio, fileToGenerativePart } from '../services/geminiService';
import { MODEL_REGISTRY, AIModel } from '../services/llm/models';
import { generateTextOpenAI } from '../services/llm/providers';
import { llmPipeline } from '../services/llm'; 
import { MarkdownRenderer } from './common/MarkdownRenderer';

// --- NEW AI ARCHITECTURE IMPORTS ---
import { classifyIntent } from '../services/ai/Router';
import { getPersona } from '../services/ai/factory';
import { AIContext } from '../services/ai/types';
import { StudentMemoryManager } from '../services/ai/memory/StudentMemoryManager';
import { ContextCompactor } from '../services/ai/memory/ContextCompactor';
import { StudentMemoryModal } from './ai/StudentMemoryModal';
import { PersonaLockMode } from '../types';

// --- NEW GENUI IMPORTS ---
import { GenUIChart, GenUIChecklist, GenUIDiagram, GenUIMindMap, GenUITimeLine, GenUIFlashCard, GenUIQuizBlock, GenUIProgressBar } from './genui/GenUIComponents';

interface ChatSession {
    id: string;
    title: string;
    updatedAt: number;
    messages: ChatMessage[];
}

interface AiAssistantProps {
  reports: TestReport[];
  questionLogs: QuestionLog[];
  setView: (view: 'question-log-editor') => void;
  setActiveLogFilter: (filter: AiFilter | null) => void;
  apiKey: string;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  studyGoals: StudyGoal[];
  setStudyGoals: React.Dispatch<React.SetStateAction<StudyGoal[]>>;
  preferences: AiAssistantPreferences;
  onUpdatePreferences?: React.Dispatch<React.SetStateAction<AiAssistantPreferences>>;
  userProfile: UserProfile; 
  onAddTasksToPlanner?: (tasks: { task: string, time: number, topic: string }[]) => void; 
}

const GOOGLE_MODELS = MODEL_REGISTRY.filter(m => m.provider === 'google' && !m.id.includes('image') && !m.id.includes('tts'));
const GROQ_MODELS = MODEL_REGISTRY.filter(m => m.provider === 'groq' && !m.id.includes('image') && !m.id.includes('tts'));
const OPENROUTER_MODELS = MODEL_REGISTRY.filter(m => m.provider === 'openrouter' && !m.id.includes('image') && !m.id.includes('tts'));

// ... [TestReportCard, VoiceVisualizer, createBlob, ModelDropdownItem - UNCHANGED]
const TestReportCard: React.FC<{ report: TestReport }> = ({ report }) => {
    const subjects: ('physics' | 'chemistry' | 'maths' | 'total')[] = ['physics', 'chemistry', 'maths', 'total'];
    return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 my-1"><h4 className="font-bold text-cyan-300">{report.testName}</h4><p className="text-xs text-gray-400 mb-2">{new Date(report.testDate + "T00:00:00").toLocaleDateString()}</p><div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">{subjects.map(subject => (<div key={subject} className="flex justify-between border-b border-slate-700/50 py-1"><span className="capitalize text-gray-300">{subject}</span><span className="font-semibold text-white">{report[subject].marks}</span></div>))}</div></div>
    );
};
const VoiceVisualizer: React.FC<{ isActive: boolean; volume: number; status: 'listening' | 'thinking' | 'speaking' }> = ({ isActive, volume, status }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (!isActive || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        let animationId: number; let time = 0;
        const render = () => {
            const width = canvasRef.current!.width; const height = canvasRef.current!.height; const centerX = width / 2; const centerY = height / 2;
            ctx.clearRect(0, 0, width, height);
            const baseRadius = status === 'thinking' ? 40 : 50 + (volume * 50);
            const color = status === 'thinking' ? '#f59e0b' : status === 'speaking' ? '#22d3ee' : '#818cf8';
            if (status === 'thinking') { ctx.beginPath(); ctx.arc(centerX, centerY, baseRadius + Math.sin(time * 5) * 5, 0, Math.PI * 2); ctx.fillStyle = `${color}44`; ctx.fill(); }
            ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
            for (let i = 0; i < 100; i++) { const angle = (i / 100) * Math.PI * 2; const r = baseRadius + Math.sin(angle * 5 + time * 3) * (volume * 20 + 5); const x = centerX + Math.cos(angle) * r; const y = centerY + Math.sin(angle) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
            ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(centerX, centerY, 20, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); time += 0.05; animationId = requestAnimationFrame(render);
        };
        render(); return () => cancelAnimationFrame(animationId);
    }, [isActive, volume, status]);
    return <canvas ref={canvasRef} width={300} height={300} className="w-64 h-64 mx-auto" />;
};
function createBlob(data: Float32Array): GenAiBlob { const l = data.length; const int16 = new Int16Array(l); for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; } return { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000', }; }

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button 
            onClick={handleCopy} 
            type="button"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Copy message to clipboard"
        >
            {copied ? (
                <>
                    <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-emerald-400 font-medium">Copied</span>
                </>
            ) : (
                <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                </>
            )}
        </button>
    );
};

const groupSessionsByDate = (sessionList: ChatSession[]) => {
    const groups: { [key: string]: ChatSession[] } = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Older': []
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 6 * 86400000;

    sessionList.forEach(session => {
        const time = session.updatedAt || Number(session.id) || Date.now();
        if (time >= startOfToday) {
            groups['Today'].push(session);
        } else if (time >= startOfYesterday) {
            groups['Yesterday'].push(session);
        } else if (time >= startOf7Days) {
            groups['Previous 7 Days'].push(session);
        } else {
            groups['Older'].push(session);
        }
    });

    return groups;
};

const ModelDropdownItem: React.FC<{ model: AIModel; isSelected: boolean; onClick: () => void }> = ({ model, isSelected, onClick }) => (
    <button 
        onClick={onClick} 
        className={`w-full text-left p-3 flex items-start gap-3 transition-colors border-b border-slate-700/50 hover:bg-slate-700/30 ${isSelected ? 'bg-indigo-900/20' : ''}`}
    >
        <span className="text-xl mt-0.5">{model.icon}</span>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-sm font-bold truncate ${isSelected ? 'text-cyan-400' : 'text-gray-200'}`}>{model.name}</span>
                <span className={`text-[9px] px-1.5 rounded uppercase font-bold tracking-wider border ${
                    model.provider === 'google' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    model.provider === 'groq' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}>
                    {model.provider}
                </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{model.description}</p>
            <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    {(model.contextWindow / 1000)}k Context
                </span>
                <span className={`text-[9px] font-bold ${model.costCategory === 'free' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {model.costCategory === 'free' ? 'FREE' : 'PAID'}
                </span>
            </div>
        </div>
        {isSelected && <span className="text-cyan-400 font-bold">✓</span>}
    </button>
);

// Main Component
export const AiAssistant: React.FC<AiAssistantProps> = ({ 
    reports, 
    questionLogs, 
    setView, 
    setActiveLogFilter, 
    apiKey, 
    chatHistory, 
    setChatHistory, 
    activeSessionId,
    setActiveSessionId,
    studyGoals, 
    setStudyGoals, 
    preferences, 
    onUpdatePreferences, 
    userProfile, 
    onAddTasksToPlanner 
}) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');
    
    const [userInput, setUserInput] = useState('');
    const [isStreamingResponse, setIsStreamingResponse] = useState(false);
    const [attachedImages, setAttachedImages] = useState<File[]>([]);
    const [attachedAudio, setAttachedAudio] = useState<File | null>(null);
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
    
    const [isSecondarySelectorOpen, setIsSecondarySelectorOpen] = useState(false);
    const [secondaryModelId, setSecondaryModelId] = useState<string>('none');
    
    // NEW: Chat Sessions State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('jee_ai_sidebar_open');
        if (saved !== null) return saved === 'true';
        return true; // Default open so chat history on left is immediately visible
    });
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => {
            const next = !prev;
            try { localStorage.setItem('jee_ai_sidebar_open', String(next)); } catch (e) {}
            return next;
        });
    }, []);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
    const [recentlyDeletedSession, setRecentlyDeletedSession] = useState<{ session: ChatSession; index: number } | null>(null);
    const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
    const [memoryCount, setMemoryCount] = useState(() => StudentMemoryManager.getMemories().length);
    const [personaLock, setPersonaLock] = useState<PersonaLockMode>(preferences.personaLock || 'auto');
    const [isPersonaSelectorOpen, setIsPersonaSelectorOpen] = useState(false);
    const personaSelectorRef = useRef<HTMLDivElement>(null);

    const isInitialized = useRef(false);
    const activeSessionIdRef = useRef(activeSessionId);
    
    useEffect(() => {
        activeSessionIdRef.current = activeSessionId;
    }, [activeSessionId]);

    // Cleanup undo timer on unmount
    useEffect(() => {
        return () => {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        };
    }, []);

    // Keyboard shortcut for New Chat (Ctrl+N or Cmd+N)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                handleNewChat();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    // NEW: Context Scope State
    const [contextScope, setContextScope] = useState<'recent' | 'full'>('recent');
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [useDeepThinking, setUseDeepThinking] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const modelSelectorRef = useRef<HTMLDivElement>(null);
    const secondarySelectorRef = useRef<HTMLDivElement>(null);
    const ai = useMemo(() => new GoogleGenAI({ apiKey }), [apiKey]);

    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [liveStatus, setLiveStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');
    const [audioVolume, setAudioVolume] = useState(0);
    const liveSessionRef = useRef<any | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    

    // Load sessions from local storage
    useEffect(() => {
        const saved = localStorage.getItem('ai_chat_sessions');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSessions(parsed);
                // If we have sessions but no active session ID, pick the first one
                if (parsed.length > 0 && !activeSessionId) {
                    setActiveSessionId(parsed[0].id);
                    setChatHistory(parsed[0].messages);
                }
            } catch (e) {}
        }
        isInitialized.current = true;
    }, []);

    // Track whether user intentionally scrolled up so auto-scroll doesn't fight them
    const isUserScrolledUp = useRef(false);

    // Save current session when chatHistory changes, but ONLY when not streaming
    useEffect(() => {
        if (chatHistory.length > 1 && !isStreamingResponse && isInitialized.current) {
            const title = typeof chatHistory[1].content === 'string' 
                ? chatHistory[1].content.substring(0, 32) + (chatHistory[1].content.length > 32 ? '...' : '')
                : 'New Chat';
            
            const currentId = activeSessionId || Date.now().toString();
            if (!activeSessionId) setActiveSessionId(currentId);

            setSessions(prev => {
                const existingIndex = prev.findIndex(s => s.id === currentId);
                let newSessions = [...prev];
                if (existingIndex >= 0) {
                    if (newSessions[existingIndex].messages === chatHistory) return prev;
                    newSessions[existingIndex] = { ...newSessions[existingIndex], messages: chatHistory, updatedAt: Date.now() };
                } else {
                    newSessions.unshift({ id: currentId, title, messages: chatHistory, updatedAt: Date.now() });
                }
                try {
                    localStorage.setItem('ai_chat_sessions', JSON.stringify(newSessions));
                } catch (e) {
                    console.error("Failed to save chat sessions", e);
                }
                return newSessions;
            });
        }
    }, [chatHistory, activeSessionId, isStreamingResponse]);

    const handleNewChat = () => {
        setActiveSessionId(Date.now().toString());
        setChatHistory([{ role: 'model', content: "Hello! I'm your AI performance coach. Ask me anything about your test reports, or generate a study plan.", timestamp: Date.now() }]);
        setIsStreamingResponse(false);
        isUserScrolledUp.current = false;
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };

    const handleSelectSession = (id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            setActiveSessionId(id);
            setChatHistory(session.messages);
            setIsStreamingResponse(false);
            isUserScrolledUp.current = false;
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
            // Scroll to bottom on initial load of session
            requestAnimationFrame(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            });
        }
    };

    const handleRenameSession = (id: string, newTitle: string) => {
        const trimmed = newTitle.trim();
        if (!trimmed) {
            setEditingSessionId(null);
            return;
        }
        setSessions(prev => {
            const next = prev.map(s => s.id === id ? { ...s, title: trimmed, updatedAt: Date.now() } : s);
            try {
                localStorage.setItem('ai_chat_sessions', JSON.stringify(next));
            } catch (e) {
                console.error("Failed to save renamed session", e);
            }
            return next;
        });
        setEditingSessionId(null);
    };

    const confirmDeleteSession = () => {
        if (!sessionToDelete) return;
        const target = sessionToDelete;
        const targetIndex = sessions.findIndex(s => s.id === target.id);

        if (targetIndex !== -1) {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            setRecentlyDeletedSession({
                session: target,
                index: targetIndex
            });
            undoTimerRef.current = setTimeout(() => {
                setRecentlyDeletedSession(null);
            }, 7000);
        }

        setSessions(prev => {
            const next = prev.filter(s => s.id !== target.id);
            try {
                localStorage.setItem('ai_chat_sessions', JSON.stringify(next));
            } catch (e) {
                console.error("Failed to update sessions after delete", e);
            }
            return next;
        });

        if (activeSessionId === target.id) {
            handleNewChat();
        }
        setSessionToDelete(null);
    };

    const handleUndoDelete = () => {
        if (!recentlyDeletedSession) return;
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        const { session, index } = recentlyDeletedSession;

        setSessions(prev => {
            const next = [...prev];
            const insertIdx = Math.min(Math.max(0, index), next.length);
            next.splice(insertIdx, 0, session);
            try {
                localStorage.setItem('ai_chat_sessions', JSON.stringify(next));
            } catch (e) {
                console.error("Failed to restore session", e);
            }
            return next;
        });

        setActiveSessionId(session.id);
        setChatHistory(session.messages);
        setRecentlyDeletedSession(null);
    };

    // Filter sessions by search query across title and message content
    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return sessions;
        const q = searchQuery.toLowerCase().trim();
        return sessions.filter(s => {
            if (s.title.toLowerCase().includes(q)) return true;
            return s.messages.some(m => typeof m.content === 'string' && m.content.toLowerCase().includes(q));
        });
    }, [sessions, searchQuery]);

    // Group sessions chronologically (Today, Yesterday, Previous 7 Days, Older)
    const groupedSessions = useMemo(() => {
        return groupSessionsByDate(filteredSessions);
    }, [filteredSessions]);

    const lastChatScrollTop = useRef(0);
    const accumulatedScrollDelta = useRef(0);
    const scrollRafId = useRef<number | null>(null);
    const [isTopBarVisible, setIsTopBarVisible] = useState(true);
    const [isInputHovered, setIsInputHovered] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const isBottomBarActive = isInputHovered || isInputFocused || userInput.trim().length > 0 || attachedImages.length > 0 || !!attachedAudio;

    // Cleanup scroll RAF on unmount
    useEffect(() => {
        return () => {
            if (scrollRafId.current !== null) {
                window.cancelAnimationFrame(scrollRafId.current);
            }
        };
    }, []);

    const handleScroll = useCallback(() => {
        if (!chatContainerRef.current) return;
        if (scrollRafId.current !== null) return;

        scrollRafId.current = window.requestAnimationFrame(() => {
            scrollRafId.current = null;
            if (!chatContainerRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            isUserScrolledUp.current = distanceFromBottom > 120;

            const delta = scrollTop - lastChatScrollTop.current;

            // 1. Extreme Bottom Guard:
            // When reaching or resting within 45px of the bottom:
            // Ensure headers remain smoothly hidden (disappeared).
            // Prevents rubber-banding, sub-pixel rounding, and container height reflow from causing rapid flickering.
            if (distanceFromBottom <= 45) {
                if (scrollTop > 30) {
                    setIsTopBarVisible(false);
                    window.dispatchEvent(new CustomEvent('ai-chat-header-toggle', { detail: { hide: true } }));
                }
                accumulatedScrollDelta.current = 0;
                lastChatScrollTop.current = scrollTop;
                return;
            }

            // 2. Top Guard: Near the very top, always smoothly reveal headers
            if (scrollTop <= 15) {
                setIsTopBarVisible(true);
                window.dispatchEvent(new CustomEvent('ai-chat-header-toggle', { detail: { hide: false } }));
                accumulatedScrollDelta.current = 0;
                lastChatScrollTop.current = Math.max(0, scrollTop);
                return;
            }

            // 3. Direction reversal check: reset accumulated delta when reversing direction
            if ((delta > 0 && accumulatedScrollDelta.current < 0) || (delta < 0 && accumulatedScrollDelta.current > 0)) {
                accumulatedScrollDelta.current = 0;
            }
            accumulatedScrollDelta.current += delta;

            // 4. Threshold triggers:
            if (accumulatedScrollDelta.current > 15 && scrollTop > 30) {
                // Downward scroll passed threshold -> smoothly hide headers
                setIsTopBarVisible(false);
                window.dispatchEvent(new CustomEvent('ai-chat-header-toggle', { detail: { hide: true } }));
                accumulatedScrollDelta.current = 0;
            } else if (accumulatedScrollDelta.current < -15 && distanceFromBottom > 60) {
                // Upward scroll away from the bottom -> smoothly reveal headers
                setIsTopBarVisible(true);
                window.dispatchEvent(new CustomEvent('ai-chat-header-toggle', { detail: { hide: false } }));
                accumulatedScrollDelta.current = 0;
            }

            lastChatScrollTop.current = scrollTop;
        });
    }, []);

    useEffect(() => {
        if (chatContainerRef.current && !isUserScrolledUp.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory.length, isStreamingResponse]);

    useEffect(() => {
        if (activeTab === 'chat' && inputRef.current && isBottomBarActive) {
            inputRef.current.focus();
        }
    }, [activeTab, isBottomBarActive]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
                setIsModelSelectorOpen(false);
            }
            if (secondarySelectorRef.current && !secondarySelectorRef.current.contains(event.target as Node)) {
                setIsSecondarySelectorOpen(false);
            }
            if (personaSelectorRef.current && !personaSelectorRef.current.contains(event.target as Node)) {
                setIsPersonaSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (liveSessionRef.current) {
                liveSessionRef.current.close();
                liveSessionRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [activeTab]);

    const handleUserInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setAttachedImages(prev => [...prev, ...Array.from(files)]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachedAudio(file);
        }
    };

    const handleRemoveImage = (indexToRemove?: number) => {
        if (typeof indexToRemove === 'number') {
            setAttachedImages(prev => prev.filter((_, i) => i !== indexToRemove));
        } else {
            setAttachedImages([]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveAudio = () => {
        setAttachedAudio(null);
        if(audioInputRef.current) audioInputRef.current.value = '';
    };

    const handleModelChange = (modelId: string) => {
        if (onUpdatePreferences) {
            onUpdatePreferences(prev => ({ ...prev, model: modelId }));
        }
        setIsModelSelectorOpen(false);
    };

    const handleSecondaryModelChange = (modelId: string) => {
        setSecondaryModelId(modelId);
        setIsSecondarySelectorOpen(false);
    };

    // FIXED: Use MODEL_REGISTRY to find the model so providers other than Google are correctly identified
    const currentModel = MODEL_REGISTRY.find(m => m.id === preferences.model) || { id: 'none', name: 'No Selection', provider: 'google', description: 'Bypass Google models', contextWindow: 0, costCategory: 'free', icon: '○' } as AIModel;
    const currentSecondary = [...GROQ_MODELS, ...OPENROUTER_MODELS].find(m => m.id === secondaryModelId);

    const handleScopeChange = (scope: 'recent' | 'full') => {
        setContextScope(scope);
    };

    const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        if ((userInput.trim() === '' && attachedImages.length === 0 && !attachedAudio) || isStreamingResponse) return;

        const currentInput = userInput;
        const currentImages = attachedImages;
        const currentAudio = attachedAudio;
        
        setUserInput('');
        setAttachedImages([]);
        setAttachedAudio(null);
        if(inputRef.current) { inputRef.current.style.height = 'auto'; }
        
        // 1. Auto-extract any durable student statements into memory bank
        const extractedMemory = StudentMemoryManager.inspectAndExtractFromQuery(currentInput);
        if (extractedMemory) {
            setMemoryCount(StudentMemoryManager.getMemories().length);
        }

        // 2. Prepare rolling compacted context (protects TPM limits & slashes TTFT latency)
        const compactedContext = ContextCompactor.prepareContext(chatHistory);

        let userMessageContent = currentInput;
        if (currentImages.length > 0 && currentAudio) userMessageContent = `[${currentImages.length} Images & Audio Uploaded] ${currentInput}`;
        else if (currentImages.length > 0) userMessageContent = `[${currentImages.length === 1 ? 'Image' : `${currentImages.length} Images`} Uploaded] ${currentInput}`;
        else if (currentAudio) userMessageContent = `[Audio Uploaded] ${currentInput}`;

        setChatHistory(prev => [...prev, { role: 'user', content: userMessageContent, timestamp: Date.now() }]);
        setIsStreamingResponse(true);
        const currentSessionId = activeSessionIdRef.current;

        // --- CORE GENERATION LOGIC ---
        const executeGeneration = async (modelId: string, fallbackFrom?: string) => {
            // 1. Classify Intent & Resolve Persona with Lock Support
            const intent = await classifyIntent(currentInput, apiKey);
            const persona = getPersona(intent, personaLock);
            
            // 2. Cross-Session Memory & Working Summary
            const crossSessionMemory = StudentMemoryManager.formatForPrompt();

            // 2.5 Retrieval (RAG or Full History)
            let ragContext = "";
            let effectiveScope = contextScope;
            
            // Safety Check for Context Window if user switched model after setting scope
            const activeModelDef = MODEL_REGISTRY.find(m => m.id === modelId) || currentModel;
            if (contextScope === 'full' && activeModelDef.contextWindow < 100000) {
                effectiveScope = 'recent';
            }

            if (effectiveScope === 'full') {
                ragContext = formatFullHistoryContext(reports, questionLogs);
            } else if (intent !== 'GENERAL' && intent !== 'EMOTIONAL') {
                 ragContext = await retrieveRelevantContext(currentInput, questionLogs, apiKey);
            }

            // 3. Construct Context with Injected Memory
            const aiContext: AIContext = {
                reports,
                logs: questionLogs,
                userProfile,
                preferences: { ...preferences, model: modelId, personaLock }, 
                userQuery: currentInput,
                ragContext,
                crossSessionMemory,
                workingSummary: compactedContext.foldedSummary,
                personaLock
            };

            // 4. Get System Instruction & Tools with Injected Memory & Folded Working Context
            let systemInstruction = persona.getSystemInstruction(aiContext);
            if (crossSessionMemory) {
                systemInstruction = `${systemInstruction}\n\n${crossSessionMemory}`;
            }
            if (compactedContext.foldedSummary) {
                systemInstruction = `${systemInstruction}\n\n${compactedContext.foldedSummary}`;
            }

            const allowedTools = persona.getTools();
            
            // Detect if model is Google or External
            const modelDef = MODEL_REGISTRY.find(m => m.id === modelId);
            const isGoogleModel = !modelDef || modelDef.provider === 'google' || modelId.includes('gemini') || modelId.includes('gemma');

            if (isGoogleModel) {
                // --- GOOGLE SDK STREAMING PATH ---
                const parts: any[] = [];
                if (currentInput) parts.push({ text: currentInput });
                else if (currentImages.length === 0 && !currentAudio) parts.push({ text: "Analyze this." });

                if (currentImages.length > 0) {
                    for (const img of currentImages) {
                        const imagePart = await fileToGenerativePart(img);
                        parts.unshift(imagePart);
                    }
                }
                if (currentAudio) {
                    const audioPart = await fileToGenerativePart(currentAudio);
                    parts.unshift(audioPart);
                }

                const isGemma = modelId.toLowerCase().includes('gemma');
                let reqConfig: any = {};
                
                // Map compacted verbatim messages only (drastically reduces TPM token burn)
                const historyContents = compactedContext.verbatimMessages.map(msg => {
                    let textContent = '';
                    if (typeof msg.content === 'string') {
                        textContent = msg.content.replace(/\n\n<div class="text-\[10px\].*?<\/div>/g, '');
                    } else {
                        textContent = JSON.stringify(msg.content);
                    }
                    return {
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: textContent }]
                    };
                });
                
                let reqContents = [...historyContents, { role: 'user', parts: parts }];

                if (isGemma) {
                    const textParts = parts.filter(p => p.text);
                    if (textParts.length > 0) {
                        textParts[0].text = `SYSTEM: ${systemInstruction}\n\nUSER QUERY: ${textParts[0].text}`;
                    }
                    reqContents = [{ role: 'user', parts: textParts }];
                    reqConfig = { safetySettings: [] };
                } else {
                    const tools: any[] = allowedTools.length > 0 ? [{ functionDeclarations: allowedTools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters })) }] : [];
                    if (useWebSearch) {
                        tools.push({ googleSearch: {} });
                    }
                    
                    reqConfig = {
                        systemInstruction,
                        tools: tools.length > 0 ? tools : undefined,
                    };
                    
                    if (useDeepThinking && modelId.includes('gemini-3')) {
                        reqConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
                    }
                }

                const response = await ai.models.generateContentStream({
                    model: modelId, 
                    contents: reqContents,
                    config: reqConfig
                });

                let streamedText = '';
                let streamedThought = '';

                for await (const chunk of response) {
                    if (activeSessionIdRef.current !== currentSessionId) {
                        break;
                    }
                    const toolCall = chunk.functionCalls?.[0];
                    if (toolCall) {
                        let genType: GenUIToolType = 'none';
                        if (toolCall.name === 'renderChart') genType = 'chart';
                        else if (toolCall.name === 'createActionPlan') genType = 'checklist';
                        else if (toolCall.name === 'renderDiagram') genType = 'chart'; 
                        else if (toolCall.name === 'createMindMap') genType = 'chart'; 

                        const genData: GenUIComponentData = {
                            type: genType, 
                            data: toolCall.args,
                            id: toolCall.id || Date.now().toString()
                        };
                        
                        if (toolCall.name === 'renderDiagram') {
                            setChatHistory(prev => [...prev, { role: 'model', content: { type: 'genUI', component: { ...genData, type: 'diagram' as any } } }]);
                        } else if (toolCall.name === 'createMindMap') {
                            setChatHistory(prev => [...prev, { role: 'model', content: { type: 'genUI', component: { ...genData, type: 'mindmap' as any } } }]);
                        } else if (genData.type !== 'none') {
                            setChatHistory(prev => [...prev, { role: 'model', content: { type: 'genUI', component: genData } }]);
                        }
                        continue; 
                    }

                    // Extract thought parts if thinkingConfig was active
                    const candParts = (chunk as any).candidates?.[0]?.content?.parts;
                    if (Array.isArray(candParts)) {
                        for (const p of candParts) {
                            if (p?.thought && p?.text) {
                                streamedThought += p.text;
                            }
                        }
                    }

                    if (chunk.text) {
                        streamedText += chunk.text;
                    }

                    if (chunk.text || streamedThought) {
                        setChatHistory(prev => {
                            const last = prev[prev.length - 1];
                            let displayContent = streamedText;
                            
                            if (last?.role === 'model' && typeof last.content === 'string') {
                                return [...prev.slice(0, -1), { 
                                    role: 'model', 
                                    content: displayContent, 
                                    thinkingContent: streamedThought || last.thinkingContent 
                                }];
                            }
                            return [...prev, { 
                                role: 'model', 
                                content: displayContent, 
                                thinkingContent: streamedThought || undefined 
                            }];
                        });
                    }
                }

                // 7. Append Model Footer (Google Models Only - Manual Logic)
                if (activeSessionIdRef.current === currentSessionId) {
                    const usedModelName = modelDef ? modelDef.name : modelId;
                    let footerHtml = '';
                    
                    if (fallbackFrom && fallbackFrom !== 'none') {
                        const fallbackName = MODEL_REGISTRY.find(m => m.id === fallbackFrom)?.name || fallbackFrom;
                        footerHtml = `\n\n<div class="text-[10px] text-slate-400 mt-4 pt-2 border-t border-slate-700/50 flex items-center gap-1"><span class="text-amber-500">⚠️</span> Fallback to <strong>${usedModelName}</strong> <span class="text-slate-500">(${fallbackName} unavailable)</span></div>`;
                    } else {
                        footerHtml = `\n\n<div class="text-[10px] text-slate-500 mt-4 pt-2 border-t border-slate-700/50 flex items-center gap-1"><span>⚡</span> Generated by <strong>${usedModelName}</strong></div>`;
                    }

                    setChatHistory(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.role === 'model' && typeof last.content === 'string' && !last.content.includes('Generated by <strong>') && !last.content.includes('Fallback to <strong>')) {
                             return [...prev.slice(0, -1), { ...last, content: last.content + footerHtml }];
                        }
                        return prev;
                    });
                }

            } else {
                // --- EXTERNAL PROVIDER PATH ---
                // For external models, we delegate the fallback logic AND the footer generation to the llmPipeline directly.
                // We do NOT manually append the footer here, because llmPipeline will do it, ensuring the footer accurately reflects
                // which model was *actually* used after any internal fallbacks.
                
                // Map Broad Intent to Granular Task Category for External Routing
                let taskCategory: LlmTaskCategory = 'chat_general';
                if (intent === 'ANALYSIS') taskCategory = 'analysis_deep';
                if (intent === 'PLANNING') taskCategory = 'planning_routine';
                if (intent === 'CONCEPT') taskCategory = 'stem_core';
                if (intent === 'EMOTIONAL') taskCategory = 'creative_writing';

                const responseText = await llmPipeline({
                    task: taskCategory,
                    prompt: currentInput,
                    systemInstruction: systemInstruction,
                    userPreferences: {
                        ...preferences,
                        modelOverrides: { [taskCategory]: modelId } // Force override
                    },
                    googleApiKey: apiKey,
                    expectJson: false,
                    includeFooter: true, // IMPORTANT: Tell pipeline to append footer
                    fallbackFrom: fallbackFrom,
                    chatHistory: compactedContext.verbatimMessages.map(h => ({
                        role: h.role,
                        content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content)
                    }))
                });

                if (activeSessionIdRef.current === currentSessionId) {
                    setChatHistory(prev => [...prev, { role: 'model', content: responseText }]);
                }
            }
        };

        // --- EXECUTION WITH OUTER FALLBACK ---
        // If the *entire* execution block fails (e.g. Google SDK limit), we catch it here.
        
        const primaryModelId = preferences.model;
        const backupModelId = secondaryModelId;

        try {
            // 1. Always attempt the Primary model first if selected
            if (primaryModelId !== 'none') {
                await executeGeneration(primaryModelId);
            } else if (backupModelId !== 'none') {
                // If primary is 'none', go straight to secondary
                await executeGeneration(backupModelId);
            } else {
                throw new Error("No AI models selected. Please select a model from the dropdowns.");
            }
        } catch (err) {
            console.warn(`Primary model ${primaryModelId} failed.`, err);
            
            // 2. Fallback to Secondary if configured and primary failed
            if (primaryModelId !== 'none' && backupModelId !== 'none' && backupModelId !== primaryModelId) {
                try {
                    // Pass primaryModelId as 'fallbackFrom' to generate the correct UI message
                    await executeGeneration(backupModelId, primaryModelId);
                } catch (fallbackErr) {
                    console.error("Fallback generation error:", fallbackErr);
                    if (activeSessionIdRef.current === currentSessionId) {
                        setChatHistory(prev => [...prev, { role: 'model', content: `Error generating response.\nPrimary (${primaryModelId}) failed: ${(err as Error).message}\nFallback (${backupModelId}) failed: ${(fallbackErr as Error).message}` }]);
                    }
                }
            } else {
                if (activeSessionIdRef.current === currentSessionId) {
                    setChatHistory(prev => [...prev, { role: 'model', content: `Error generating response.\nDetails: ${(err as Error).message}` }]);
                }
            }
        }
        
        if (activeSessionIdRef.current === currentSessionId) {
            setIsStreamingResponse(false);
        }

    }, [userInput, attachedImages, attachedAudio, isStreamingResponse, ai, questionLogs, reports, preferences, secondaryModelId, userProfile, contextScope, chatHistory, useWebSearch, useDeepThinking, apiKey]);

    // ... [startLiveSession, stopLiveSession... UNCHANGED]
    const startLiveSession = async () => { if (!apiKey) return; try { audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }); const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 }); const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const source = inputCtx.createMediaStreamSource(stream); const processor = inputCtx.createScriptProcessor(4096, 1, 1); audioWorkletRef.current = processor; const sessionPromise = ai.live.connect({ model: 'gemini-2.5-flash-native-audio-preview-09-2025', config: { responseModalities: [Modality.AUDIO], systemInstruction: `You are an AI Coach.` }, callbacks: { onopen: () => { setIsLiveConnected(true); setLiveStatus('listening'); processor.onaudioprocess = (e) => { const inputData = e.inputBuffer.getChannelData(0); let sum = 0; for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i]; setAudioVolume(Math.sqrt(sum / inputData.length)); const blob = createBlob(inputData); sessionPromise.then(session => session.sendRealtimeInput({ media: blob })); }; source.connect(processor); processor.connect(inputCtx.destination); }, onmessage: async (msg: LiveServerMessage) => { const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data; if (audioData) { setLiveStatus('speaking'); const buffer = await decodeAudioData( decodeAudio(audioData), audioContextRef.current!, 24000, 1 ); const source = audioContextRef.current!.createBufferSource(); source.buffer = buffer; source.connect(audioContextRef.current!.destination); const now = audioContextRef.current!.currentTime; nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now); source.start(nextStartTimeRef.current); nextStartTimeRef.current += buffer.duration; source.onended = () => setLiveStatus('listening'); } if (msg.serverContent?.interrupted) { nextStartTimeRef.current = audioContextRef.current!.currentTime; setLiveStatus('listening'); } }, onclose: () => { setIsLiveConnected(false); }, onerror: (e) => { console.error(e); setIsLiveConnected(false); } } }); liveSessionRef.current = await sessionPromise; } catch (e) { console.error("Failed to start live session", e); alert("Microphone access denied or API error."); } };
    const stopLiveSession = () => { if (liveSessionRef.current) { liveSessionRef.current.close(); liveSessionRef.current = null; } if (audioWorkletRef.current) { audioWorkletRef.current.disconnect(); audioWorkletRef.current = null; } if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; } setIsLiveConnected(false); };
    const handleSuggestionClick = (suggestion: string) => { setIsInputHovered(true); setIsInputFocused(true); setUserInput(suggestion); setTimeout(() => inputRef.current?.focus(), 0); };
    const suggestions = [ 
        "🧪 Feynman Explanation Mode: Test my Rotational Motion understanding",
        "Analyze my Physics weak areas", 
        "Create a study checklist for Electrostatics", 
        "Show me my score trend chart", 
        "Why did I lose marks in the last test?" 
    ];

    // Rendering Helper for GenUI logic
    const renderMessageContent = (msg: ChatMessage) => {
        if (typeof msg.content === 'string') {
            return <MarkdownRenderer content={msg.content} />;
        }
        
        if (msg.content.type === 'testReport') {
            return <TestReportCard report={msg.content.data} />;
        }
        
        if (msg.content.type === 'genUI') {
            const { component } = msg.content;
            
            if (component.type === 'chart') {
                return <GenUIChart data={component.data} />;
            }
            
            if (component.type === 'checklist') {
                return <GenUIChecklist data={component.data} onAddToPlanner={onAddTasksToPlanner} />;
            }
            
            if ((component as any).type === 'diagram') {
                return <GenUIDiagram data={component.data} />;
            }
            
            if ((component as any).type === 'mindmap') {
                return <GenUIMindMap data={component.data} />;
            }
            if ((component as any).type === 'timeline') {
                return <GenUITimeLine data={component.data} />;
            }
            if ((component as any).type === 'flashcard') {
                return <GenUIFlashCard data={component.data} />;
            }
            if ((component as any).type === 'quizblock') {
                return <GenUIQuizBlock data={component.data} />;
            }
            if ((component as any).type === 'progressbar') {
                return <GenUIProgressBar data={component.data} />;
            }
        }
        
        return null;
    };

    const ChatMessageBubble = React.useCallback(({ msg }: { msg: ChatMessage }) => {
        const isUser = msg.role === 'user';
        const textToCopy = typeof msg.content === 'string'
            ? msg.content.replace(/\n\n<div class="text-\[10px\].*?<\/div>/g, '')
            : '';
        const timeString = msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

        if (isUser) {
            return (
                <div className="flex flex-col items-end w-full animate-fade-in">
                    <div className="max-w-[90%] sm:max-w-[80%] p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-slate-800 border border-slate-700 text-slate-100 shadow-sm">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap select-text break-words">
                            {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1.5 text-[10px] text-slate-500">
                        <span>You</span>
                        {timeString && (
                            <>
                                <span>•</span>
                                <span>{timeString}</span>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-start w-full animate-fade-in">
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-sm">
                    {/* Assistant Message Header Bar */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                                <span>⚡</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-300">AI Coach</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                                {currentModel.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {textToCopy && <CopyButton text={textToCopy} />}
                            {timeString && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {timeString}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Deep Thinking Accordion */}
                    {msg.thinkingContent && (
                        <details className="mb-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs group transition-all">
                            <summary className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold select-none list-none [&::-webkit-details-marker]:hidden">
                                <span className="text-sm">🧠</span>
                                <span>Thinking Process</span>
                                <span className="text-[10px] text-slate-500 font-mono group-open:hidden">(Click to expand)</span>
                                <span className="ml-auto text-slate-500 transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            <div className="mt-2.5 pt-2 border-t border-slate-800 text-slate-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 max-h-60 overflow-y-auto custom-scrollbar">
                                {msg.thinkingContent}
                            </div>
                        </details>
                    )}
                    {/* Content - zero horizontal scrollbars, natural text wrapping */}
                    <div className="text-slate-200 text-sm leading-relaxed select-text break-words">
                        {renderMessageContent(msg)}
                    </div>
                </div>
            </div>
        );
    }, [currentModel.name, onAddTasksToPlanner]);

    return (
        <div className="flex flex-1 h-full min-h-0 w-full bg-slate-900 overflow-hidden relative border-0">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}
            {/* Sidebar */}
            <div className={`
                ${isSidebarOpen ? 'w-40 sm:w-44 translate-x-0 relative' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden border-none absolute md:relative'}
                h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 ease-in-out shrink-0 z-40
            `}>
                <div className="w-40 sm:w-44 flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-cyan-400 text-sm">💬</span>
                            <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider truncate">Chats</h3>
                            <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1 py-0.2 rounded-full border border-slate-700/60">
                                {sessions.length}
                            </span>
                        </div>
                        <button onClick={toggleSidebar} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors shrink-0" title="Collapse sidebar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* New Chat Button */}
                    <div className="p-1.5 pb-1">
                        <button 
                            onClick={handleNewChat} 
                            className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold text-white bg-slate-800 hover:bg-slate-750 hover:bg-slate-700/80 rounded-lg transition-all border border-slate-700 group"
                        >
                            <div className="flex items-center gap-1.5 truncate">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>New Chat</span>
                            </div>
                        </button>
                    </div>

                    {/* Search Sessions Bar */}
                    <div className="px-1.5 pb-1.5">
                        <div className="relative flex items-center">
                            <svg className="absolute left-2 w-3 h-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-6 pr-5 py-1 bg-slate-800/80 border border-slate-700/70 text-[11px] text-slate-200 placeholder-slate-500 rounded-md focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-1.5 text-slate-400 hover:text-slate-200 text-xs font-bold"
                                    title="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grouped Session List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2.5 py-1 space-y-3">
                        {filteredSessions.length === 0 ? (
                            <div className="py-8 text-center">
                                <span className="text-2xl text-slate-600 block mb-1">🔍</span>
                                <p className="text-xs text-slate-400 font-medium">
                                    {searchQuery ? 'No matching chats found' : 'No chat history yet'}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {searchQuery ? 'Try a different search keyword' : 'Start a new conversation above'}
                                </p>
                            </div>
                        ) : (
                            Object.entries(groupedSessions).map(([groupName, groupItems]) => {
                                if (groupItems.length === 0) return null;
                                return (
                                    <div key={groupName} className="space-y-1">
                                        <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                            <span>{groupName}</span>
                                            <span className="text-[9px] bg-slate-800/80 text-slate-400 font-mono px-1.5 py-0.2 rounded-full border border-slate-700/50">
                                                {groupItems.length}
                                            </span>
                                        </div>
                                        {groupItems.map(session => (
                                            <div 
                                                key={session.id} 
                                                className={`group relative flex items-center w-full rounded-xl transition-all ${
                                                    activeSessionId === session.id 
                                                        ? 'bg-slate-800/90 text-white border-l-2 border-cyan-400 shadow-sm font-medium' 
                                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                                }`}
                                            >
                                                {editingSessionId === session.id ? (
                                                    <form 
                                                        onSubmit={(e) => { e.preventDefault(); handleRenameSession(session.id, editingTitle); }} 
                                                        className="flex-1 flex items-center gap-1 p-1 min-w-0"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={editingTitle}
                                                            onChange={(e) => setEditingTitle(e.target.value)}
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Escape') setEditingSessionId(null);
                                                            }}
                                                            className="w-full bg-slate-950 text-xs text-white px-2 py-1 rounded border border-cyan-500/60 focus:outline-none"
                                                        />
                                                        <button type="submit" className="p-1 text-cyan-400 hover:text-cyan-300" title="Save title">
                                                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button type="button" onClick={() => setEditingSessionId(null)} className="p-1 text-slate-400 hover:text-slate-200" title="Cancel">
                                                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </form>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => handleSelectSession(session.id)} 
                                                            className="flex-1 text-left px-2.5 py-2 text-xs truncate min-w-0"
                                                        >
                                                            <span className="block truncate font-medium text-slate-200 group-hover:text-white transition-colors">
                                                                {session.title}
                                                            </span>
                                                            <span className="block text-[10px] text-slate-500 mt-0.5 font-mono">
                                                                {session.messages.length} msg{session.messages.length === 1 ? '' : 's'}
                                                            </span>
                                                        </button>
                                                        {/* Actions: Edit & Safe Delete */}
                                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-1.5 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSessionId(session.id);
                                                                    setEditingTitle(session.title);
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-700/60 transition-colors"
                                                                title="Rename chat"
                                                            >
                                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSessionToDelete(session);
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/60 transition-colors"
                                                                title="Delete chat"
                                                            >
                                                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-slate-950/30">
                {/* Header Toolbar - Smoothly auto-hides on downward scroll */}
                <div className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 shrink-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md ${
                    isTopBarVisible 
                        ? 'max-h-16 opacity-100 translate-y-0 py-1.5 px-3 overflow-visible' 
                        : 'max-h-0 opacity-0 -translate-y-full py-0 px-3 border-transparent pointer-events-none overflow-hidden'
                }`}>
                    <div className="flex items-center justify-between gap-1.5 w-full">
                        {/* Left: Sidebar toggle & Models */}
                        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                            <button 
                                onClick={toggleSidebar} 
                                className={`p-1.5 px-2 text-xs font-medium rounded-full transition-colors shrink-0 border flex items-center gap-1 ${
                                    isSidebarOpen 
                                        ? 'bg-slate-800 text-cyan-400 border-cyan-500/40 shadow-xs' 
                                        : 'text-gray-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                                }`}
                                title={isSidebarOpen ? "Collapse Chat History Sidebar" : "Open Chat History Sidebar"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                                <span className="text-[11px] hidden sm:inline">{isSidebarOpen ? 'Hide' : 'Chats'}</span>
                            </button>
                            <div className="relative shrink-0" ref={modelSelectorRef}>
                                <button onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)} className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-slate-800 transition-colors text-xs font-medium text-gray-200 border border-slate-700/80 bg-slate-850 whitespace-nowrap shrink-0 shadow-xs">
                                    <span className="text-cyan-400 text-sm">{currentModel.icon || '⚡'}</span>
                                    <span className="max-w-[75px] sm:max-w-[110px] truncate">{currentModel.name}</span>
                                    <span className="text-gray-500 text-[10px]">▼</span>
                                </button>
                            {isModelSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 animate-scale-in overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                                    <button onClick={() => handleModelChange('none')} className={`w-full text-left p-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors ${preferences.model === 'none' ? 'bg-slate-700/30' : ''}`}><span className="text-xl">○</span><p className="text-sm font-bold text-gray-200">No Selection</p>{preferences.model === 'none' && <span className="ml-auto text-cyan-400 font-bold">✓</span>}</button>
                                    
                                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-slate-900/50 border-y border-slate-700">Google Native</div>
                                    {GOOGLE_MODELS.map(model => (
                                        <ModelDropdownItem 
                                            key={model.id} 
                                            model={model} 
                                            isSelected={preferences.model === model.id} 
                                            onClick={() => handleModelChange(model.id)} 
                                        />
                                    ))}

                                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-slate-900/50 border-y border-slate-700">Groq (Ultra-Fast)</div>
                                    {GROQ_MODELS.map(model => (
                                        <ModelDropdownItem 
                                            key={model.id} 
                                            model={model} 
                                            isSelected={preferences.model === model.id} 
                                            onClick={() => handleModelChange(model.id)} 
                                        />
                                    ))}

                                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-slate-900/50 border-y border-slate-700">OpenRouter (Free)</div>
                                    {OPENROUTER_MODELS.map(model => (
                                        <ModelDropdownItem 
                                            key={model.id} 
                                            model={model} 
                                            isSelected={preferences.model === model.id} 
                                            onClick={() => handleModelChange(model.id)} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="relative shrink-0" ref={secondarySelectorRef}>
                            <button onClick={() => setIsSecondarySelectorOpen(!isSecondarySelectorOpen)} className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-slate-800 transition-colors text-xs font-medium text-gray-200 border border-slate-700/80 bg-slate-850 whitespace-nowrap shrink-0 shadow-xs" title="Secondary / Fallback Model">
                                <span className={`text-sm ${secondaryModelId !== 'none' ? 'text-purple-400' : 'text-gray-500'}`}>{secondaryModelId !== 'none' ? '🧠' : '○'}</span>
                                <span className="max-w-[65px] sm:max-w-[95px] truncate">{secondaryModelId !== 'none' ? currentSecondary?.name : 'Fallback'}</span>
                                <span className="text-gray-500 text-[10px]">▼</span>
                            </button>
                            {isSecondarySelectorOpen && (
                                <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 animate-scale-in overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                                    <button onClick={() => handleSecondaryModelChange('none')} className={`w-full text-left p-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors ${secondaryModelId === 'none' ? 'bg-slate-700/30' : ''}`}><span className="text-xl">○</span><p className="text-sm font-bold text-gray-200">No Selection</p>{secondaryModelId === 'none' && <span className="ml-auto text-cyan-400 font-bold">✓</span>}</button>
                                    
                                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-slate-900/50 border-y border-slate-700">Groq (Ultra-Fast)</div>
                                    {GROQ_MODELS.map(model => (
                                        <ModelDropdownItem 
                                            key={model.id} 
                                            model={model} 
                                            isSelected={secondaryModelId === model.id} 
                                            onClick={() => handleSecondaryModelChange(model.id)} 
                                        />
                                    ))}

                                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-slate-900/50 border-y border-slate-700">OpenRouter (Free)</div>
                                    {OPENROUTER_MODELS.map(model => (
                                        <ModelDropdownItem 
                                            key={model.id} 
                                            model={model} 
                                            isSelected={secondaryModelId === model.id} 
                                            onClick={() => handleSecondaryModelChange(model.id)} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Persona Mode Selector */}
                        <div className="relative shrink-0" ref={personaSelectorRef}>
                            <button
                                onClick={() => setIsPersonaSelectorOpen(!isPersonaSelectorOpen)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-slate-800 transition-colors text-xs font-medium border whitespace-nowrap shrink-0 shadow-xs ${
                                    personaLock !== 'auto'
                                        ? 'bg-indigo-950/50 text-indigo-300 border-indigo-500/50'
                                        : 'text-gray-200 border-slate-700/80 bg-slate-850'
                                }`}
                                title="Select Persona Mode (or keep Auto-Adaptive)"
                            >
                                <span className="text-sm">
                                    {personaLock === 'auto' && '⚡'}
                                    {personaLock === 'coach' && '🎯'}
                                    {personaLock === 'tutor' && '🧪'}
                                    {personaLock === 'feynman' && '🔬'}
                                    {personaLock === 'strategist' && '📅'}
                                    {personaLock === 'therapist' && '🧘'}
                                </span>
                                <span className="max-w-[55px] sm:max-w-[80px] truncate">
                                    {personaLock === 'auto' && 'Auto'}
                                    {personaLock === 'coach' && 'Coach'}
                                    {personaLock === 'tutor' && 'Tutor'}
                                    {personaLock === 'feynman' && 'Feynman'}
                                    {personaLock === 'strategist' && 'Planner'}
                                    {personaLock === 'therapist' && 'Counselor'}
                                </span>
                                <span className="text-gray-500 text-[10px]">▼</span>
                            </button>
                            {isPersonaSelectorOpen && (
                                <div className="absolute top-full left-0 sm:left-auto mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 animate-scale-in overflow-hidden p-1.5 space-y-1">
                                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Persona Behavioral Lock
                                    </div>
                                    {[
                                        { id: 'auto', label: 'Auto-Adaptive', icon: '⚡', desc: 'Auto-routes based on prompt intent' },
                                        { id: 'coach', label: 'Master Coach', icon: '🎯', desc: 'Holistic performance & analytics' },
                                        { id: 'tutor', label: 'Professor (Tutor)', icon: '🧪', desc: 'Step-by-step problem walkthroughs' },
                                        { id: 'feynman', label: 'Feynman Drill', icon: '🔬', desc: 'Socratic questioning & stress-tests' },
                                        { id: 'strategist', label: 'Strategist', icon: '📅', desc: 'Study plans & milestone roadmaps' },
                                        { id: 'therapist', label: 'Counselor', icon: '🧘', desc: 'Burnout & exam mindset coaching' },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                const newLock = item.id as PersonaLockMode;
                                                setPersonaLock(newLock);
                                                if (onUpdatePreferences) {
                                                    onUpdatePreferences(prev => ({ ...prev, personaLock: newLock }));
                                                }
                                                setIsPersonaSelectorOpen(false);
                                            }}
                                            className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start gap-2.5 transition-colors ${
                                                personaLock === item.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:bg-slate-700/60 text-slate-300'
                                            }`}
                                        >
                                            <span className="text-base mt-0.5">{item.icon}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold flex items-center justify-between">
                                                    <span>{item.label}</span>
                                                    {personaLock === item.id && <span className="text-cyan-400 text-xs">✓</span>}
                                                </div>
                                                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Memory Bank Button */}
                        <button
                            onClick={() => setIsMemoryModalOpen(true)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-purple-900/40 transition-colors text-xs font-medium text-purple-300 bg-purple-950/40 border border-purple-500/40 whitespace-nowrap shrink-0 shadow-xs"
                            title="Open Cross-Session Student Memory Bank"
                        >
                            <span>🧠</span>
                            <span className="hidden md:inline text-[11px]">Memory</span>
                            <span className="text-[10px] px-1 py-0.2 rounded-full bg-purple-900/80 text-purple-200 border border-purple-500/50 font-mono">
                                {memoryCount}
                            </span>
                        </button>
                    </div>

                    {/* Right: Search, Thinking, Scope, Chat/Voice */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex bg-slate-950/60 rounded-full p-0.5 border border-slate-800 shrink-0">
                            <button 
                                onClick={() => setUseWebSearch(!useWebSearch)} 
                                className={`px-2.5 py-0.5 flex items-center gap-1 text-[11px] font-medium rounded-full transition-all whitespace-nowrap shrink-0 ${useWebSearch ? 'bg-slate-800 text-cyan-300 shadow-xs border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Enable Google Search Grounding"
                            >
                                <span>🌐</span>
                                <span className="hidden xl:inline">Search</span>
                            </button>
                            <button 
                                onClick={() => setUseDeepThinking(!useDeepThinking)} 
                                className={`px-2.5 py-0.5 flex items-center gap-1 text-[11px] font-medium rounded-full transition-all whitespace-nowrap shrink-0 ${useDeepThinking ? 'bg-slate-800 text-cyan-300 shadow-xs border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Enable Deep Thinking (Gemini 3 only)"
                            >
                                <span>🤔</span>
                                <span className="hidden xl:inline">Think</span>
                            </button>
                        </div>
                        <div className="flex bg-slate-950/60 rounded-full p-0.5 border border-slate-800 shrink-0">
                            <button 
                                onClick={() => setContextScope('recent')} 
                                className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full transition-all whitespace-nowrap shrink-0 ${contextScope === 'recent' ? 'bg-slate-800 text-white shadow-xs border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Fast. Sends only relevant recent data."
                            >
                                <span>Recent</span>
                            </button>
                            <button 
                                onClick={() => handleScopeChange('full')} 
                                className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full transition-all whitespace-nowrap shrink-0 ${contextScope === 'full' ? 'bg-slate-800 text-white shadow-xs border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Deep. Sends entire history."
                            >
                                <span>Full</span>
                            </button>
                        </div>

                        <div className="flex bg-slate-950/60 rounded-full p-0.5 border border-slate-800 shrink-0">
                            <button onClick={() => setActiveTab('chat')} className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full transition-all whitespace-nowrap ${activeTab === 'chat' ? 'bg-slate-800 text-white shadow-xs border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'}`}>Chat</button>
                            <button onClick={() => setActiveTab('voice')} className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full transition-all whitespace-nowrap ${activeTab === 'voice' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}>Live</button>
                        </div>
                    </div>
                </div>
            </div>

                {/* Main Content Body */}
                {activeTab === 'chat' ? (
                    <div className="flex-1 relative flex flex-col overflow-hidden">

                        {/* Messages Stream */}
                        <div 
                            ref={chatContainerRef} 
                            onScroll={handleScroll} 
                            className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto custom-scrollbar pb-16"
                        >
                            <div className="w-full space-y-4 px-1 sm:px-4 md:px-8">
                                {/* Empty State / Hero when conversation is fresh */}
                                {chatHistory.length <= 1 && (
                                    <div className="flex flex-col items-center justify-center py-6 px-2 text-center animate-fade-in">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 text-2xl text-cyan-400 shadow-sm">
                                            {currentModel.name.includes('Gemma') ? '🤖' : '⚡'}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold mb-2">
                                            <span>AI Performance Coach</span>
                                            <span>•</span>
                                            <span>{currentModel.name}</span>
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1.5">
                                            Accelerate Your JEE Mastery
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
                                            Instant root-cause analysis, Feynman conceptual drills, syllabus roadmaps, and actionable exam score strategies.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full text-left">
                                            {[
                                                {
                                                    title: "Pinpoint Weak Chapters",
                                                    subtitle: "Analyze lowest accuracy topics across subjects",
                                                    prompt: "Analyze my lowest accuracy topics across Physics, Chemistry, and Mathematics from my test logs and rank them by lost marks.",
                                                    icon: "🎯",
                                                    badge: "Analytics"
                                                },
                                                {
                                                    title: "Feynman Stress-Test",
                                                    subtitle: "Test conceptual grasp with probing questions",
                                                    prompt: "🧪 Feynman Explanation Mode: Test my understanding of Rotational Motion and Angular Momentum with 3 challenging concept checks.",
                                                    icon: "🧪",
                                                    badge: "Concepts"
                                                },
                                                {
                                                    title: "Analyze Lost Marks",
                                                    subtitle: "Breakdown silly vs conceptual errors in last test",
                                                    prompt: "Why did I lose marks in my latest mock test? Categorize my lost marks by silly calculation blunders versus deep conceptual gaps.",
                                                    icon: "📉",
                                                    badge: "Diagnosis"
                                                },
                                                {
                                                    title: "7-Day Score Acceleration",
                                                    subtitle: "High-yield revision plan to gain +25 marks",
                                                    prompt: "Create a focused 7-day revision schedule targeting my top 3 high-yield weak chapters to add +25 marks in my next test.",
                                                    icon: "⚡",
                                                    badge: "Strategy"
                                                }
                                            ].map((card, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSuggestionClick(card.prompt)}
                                                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left group shadow-sm hover:shadow-cyan-950/20 flex flex-col justify-between"
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-lg">{card.icon}</span>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
                                                            {card.badge}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                                            {card.title}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                                            {card.subtitle}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Chat Messages */}
                                {chatHistory.map((msg, index) => (
                                    <ChatMessageBubble key={`${activeSessionId || 'msg'}-${index}`} msg={msg} />
                                ))}

                                {isStreamingResponse && (
                                    <div className="flex items-center gap-2 pl-3 py-2 text-cyan-400 text-xs">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-150"></div>
                                        <span className="text-slate-400 text-[11px] font-mono ml-1">AI Coach is thinking...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hover-reveal Bottom Input Dock */}
                        <div 
                            onMouseEnter={() => setIsInputHovered(true)}
                            onMouseLeave={() => setIsInputHovered(false)}
                            className="absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            style={{
                                transform: isBottomBarActive ? 'translateY(0)' : 'translateY(calc(100% - 8px))',
                                opacity: isBottomBarActive ? 1 : 0.5
                            }}
                        >
                            {/* Subtle peek handle when tucked down */}
                            {!isBottomBarActive && (
                                <div className="h-2 w-full flex items-center justify-center cursor-pointer">
                                    <div className="w-16 h-1 rounded-full bg-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                </div>
                            )}

                            <div className="w-full px-2 sm:px-4 md:px-8 py-1.5 sm:py-2 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-md shadow-2xl">
                                {/* Attachments Preview */}
                                {attachedImages.length > 0 && (
                                    <div className="mx-1 mb-1.5 flex flex-wrap gap-2 animate-scale-in">
                                        {attachedImages.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-800/90 py-1 px-2.5 rounded-xl border border-slate-700/60 backdrop-blur-sm shadow-md">
                                                <span className="text-sm">🖼️</span>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white font-medium truncate max-w-[120px]">{file.name}</span>
                                                    <span className="text-[9px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveImage(idx)} 
                                                    className="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-700 text-gray-400 hover:text-red-400 transition-colors"
                                                    title="Remove image"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {attachedAudio && (
                                    <div className="mx-1 mb-1.5 flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700/50 w-fit animate-scale-in backdrop-blur-sm">
                                        <div className="w-10 h-10 bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center text-lg shadow-inner">🎵</div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white font-medium truncate max-w-[150px]">{attachedAudio.name}</span>
                                            <span className="text-[10px] text-gray-400">{(attachedAudio.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <button type="button" onClick={handleRemoveAudio} className="ml-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-700 text-gray-400 hover:text-red-400 transition-colors">×</button>
                                    </div>
                                )}

                                {/* Main Form */}
                                <form onSubmit={handleSendMessage} className="relative w-full bg-slate-800/80 border border-slate-700/80 backdrop-blur-xl rounded-xl shadow-md transition-all focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30">
                                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                                    <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioSelect} />
                                    <div className="flex items-center p-1 sm:p-1.5 gap-1">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-all shrink-0" title="Attach images (Multiple)">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </button>
                                        <button type="button" onClick={() => audioInputRef.current?.click()} className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-slate-700/50 rounded-lg transition-all shrink-0" title="Attach audio (Classroom Notes)">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                        </button>
                                        <textarea 
                                            ref={inputRef} 
                                            value={userInput} 
                                            onChange={handleUserInput} 
                                            onFocus={() => setIsInputFocused(true)}
                                            onBlur={() => setIsInputFocused(false)}
                                            onKeyDown={(e) => { 
                                                if (e.key === 'Enter' && !e.shiftKey) { 
                                                    e.preventDefault(); 
                                                    handleSendMessage(e); 
                                                } 
                                            }} 
                                            placeholder={`Message ${secondaryModelId !== 'none' ? currentSecondary?.name : currentModel.name}... (Shift+Enter for new line)`} 
                                            className="w-full bg-transparent text-gray-100 px-2 py-1 max-h-32 focus:outline-none resize-none text-xs sm:text-sm placeholder-gray-500 custom-scrollbar" 
                                            rows={1} 
                                            disabled={isStreamingResponse} 
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isStreamingResponse || (userInput.trim() === '' && attachedImages.length === 0 && !attachedAudio)} 
                                            className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all disabled:opacity-0 disabled:scale-75 shadow-xs shrink-0"
                                            title="Send message"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0 l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
                        <div className="relative z-10 text-center space-y-8">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Gemini Live Coach</h3>
                            <div className="h-64 w-64 relative flex items-center justify-center">{isLiveConnected ? (<VoiceVisualizer isActive={true} volume={audioVolume} status={liveStatus} />) : (<div className="w-40 h-40 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-2xl"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>)}</div>
                            <div className="h-8">{isLiveConnected && (<p className="text-cyan-400 animate-pulse font-mono text-sm uppercase tracking-widest">{liveStatus === 'listening' ? 'Listening...' : liveStatus === 'thinking' ? 'Thinking...' : 'Speaking'}</p>)}</div>
                            <button onClick={isLiveConnected ? stopLiveSession : startLiveSession} className={`px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all transform hover:scale-105 ${isLiveConnected ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/20'}`}>{isLiveConnected ? 'End Session' : 'Start Conversation'}</button>
                            {!isLiveConnected && <p className="text-sm text-gray-500">Experience real-time voice coaching with Gemini</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Safe Delete Confirmation Modal */}
            {sessionToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-white">Delete Chat Session?</h3>
                                <p className="text-xs text-slate-300">
                                    Are you sure you want to delete <span className="font-semibold text-white">"{sessionToDelete.title}"</span>?
                                </p>
                                <p className="text-[11px] text-slate-400 pt-1">
                                    This will remove the conversation from your active list. You can restore it immediately using the undo notification.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setSessionToDelete(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteSession}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Delete Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Soft Delete Undo Toast */}
            {recentlyDeletedSession && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 border border-slate-700/90 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md animate-fade-in">
                    <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                    <div className="text-xs text-slate-200">
                        Deleted <span className="font-semibold text-white max-w-[140px] inline-block truncate align-bottom">"{recentlyDeletedSession.session.title}"</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleUndoDelete}
                        className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Undo
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecentlyDeletedSession(null)}
                        className="text-slate-400 hover:text-white p-1 text-sm leading-none"
                        title="Dismiss notification"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Cross-Session Student Memory Bank Modal */}
            <StudentMemoryModal
                isOpen={isMemoryModalOpen}
                onClose={() => setIsMemoryModalOpen(false)}
                onMemoriesUpdated={() => setMemoryCount(StudentMemoryManager.getMemories().length)}
            />
        </div>
    );
};
