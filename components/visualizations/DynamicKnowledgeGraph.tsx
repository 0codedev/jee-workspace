import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Search, RotateCcw, Layers, Snowflake, Flame, X, Filter } from 'lucide-react';
import { QuestionLog, QuestionStatus } from '../../types';
import { JEE_SYLLABUS, TOPIC_DEPENDENCIES } from '../../constants';

interface Node {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    errorCount: number;
    radius: number;
    subject: string;
    isDragging: boolean;
    phase: number;
}

interface Edge {
    source: string;
    target: string;
}

interface DynamicKnowledgeGraphProps {
    logs: QuestionLog[];
    onNodeClick: (topic: string) => void;
    liteMode?: boolean;
}

// --- NEON & SEVERITY COLORS ---
const COLORS: Record<string, string> = {
    physics: '#6366f1',   // Indigo 500
    chemistry: '#10b981', // Emerald 500
    maths: '#f43f5e',     // Rose 500
    neutral: '#64748b',   // Slate 500
};

const getErrorColor = (count: number) => {
    if (count >= 5) return '#dc2626'; // Deep Red 600
    if (count >= 3) return '#ef4444'; // Red 500
    if (count >= 1) return '#f59e0b'; // Amber 500
    return '#475569'; // Slate 600
};

const getAttractor = (subject: string, width: number, height: number) => {
    switch (subject.toLowerCase()) {
        case 'physics': return { x: width * 0.25, y: height * 0.35 };
        case 'maths': return { x: width * 0.75, y: height * 0.35 };
        case 'chemistry': return { x: width * 0.5, y: height * 0.75 };
        default: return { x: width / 2, y: height / 2 };
    }
};

export const DynamicKnowledgeGraph: React.FC<DynamicKnowledgeGraphProps> = ({ logs, onNodeClick, liteMode = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const nodesRef = useRef<Node[]>([]);
    const edgesRef = useRef<Edge[]>([]);
    const nodeMapRef = useRef<Map<string, Node>>(new Map());
    const hoveredNodeRef = useRef<Node | null>(null);
    const timeRef = useRef<number>(0);
    
    const [interactionMode, setInteractionMode] = useState<'interact' | 'drilldown'>('interact');
    const [isStable, setIsStable] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<'all' | 'physics' | 'chemistry' | 'maths'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);
    const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
    const [nodeCount, setNodeCount] = useState<number>(0);

    // --- TUNED PHYSICS PARAMETERS ---
    const REPULSION = 3500;
    const SPRING_LENGTH = 150;
    const SPRING_STRENGTH = 0.005;
    const DAMPING = 0.65;
    const STABILITY_THRESHOLD = 0.05;
    const gravityFactorRef = useRef<number>(0.003);

    const interactionModeRef = useRef(interactionMode);
    const isStableRef = useRef(isStable);
    const isFrozenRef = useRef(isFrozen);
    const searchQueryRef = useRef(searchQuery);
    const physicsFrameRef = useRef(0);
    const lastHoveredTopicRef = useRef<string | null>(null);

    useEffect(() => { interactionModeRef.current = interactionMode; }, [interactionMode]);
    useEffect(() => { isStableRef.current = isStable; }, [isStable]);
    useEffect(() => { isFrozenRef.current = isFrozen; }, [isFrozen]);
    useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);

    // Intersection Observer to pause simulation off-screen
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { setIsVisible(entry.isIntersecting); },
            { threshold: 0.1 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const initGraph = useCallback(() => {
        const errorCounts = new Map<string, number>();
        logs.forEach(log => {
            if (log.topic && log.topic !== "N/A" && (log.status === QuestionStatus.Wrong || log.status === QuestionStatus.PartiallyCorrect)) {
                errorCounts.set(log.topic, (errorCounts.get(log.topic) || 0) + 1);
            }
        });

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const addedTopics = new Set<string>();

        const targetSubjects = selectedSubject === 'all' ? ['physics', 'chemistry', 'maths'] : [selectedSubject];
        targetSubjects.forEach((subject) => {
            // @ts-ignore
            (JEE_SYLLABUS[subject] || []).forEach(unit => {
                unit.chapters.forEach((chapter: any) => {
                    if (!addedTopics.has(chapter.name)) {
                        const errorCount = errorCounts.get(chapter.name) || 0;
                        newNodes.push({
                            id: chapter.name,
                            x: Math.random() * 800,
                            y: Math.random() * 600,
                            vx: 0,
                            vy: 0,
                            errorCount,
                            radius: Math.max(26, Math.min(65, 26 + Math.sqrt(errorCount) * 11)),
                            subject,
                            isDragging: false,
                            phase: Math.random() * Math.PI * 2
                        });
                        addedTopics.add(chapter.name);
                    }
                });
            });
        });

        newNodes.forEach(node => {
            const prereqs = TOPIC_DEPENDENCIES[node.id] || [];
            prereqs.forEach(p => {
                if (addedTopics.has(p)) {
                    newEdges.push({ source: p, target: node.id });
                }
            });
        });

        const relevantTopics = new Set<string>();
        newNodes.forEach(n => { if (n.errorCount > 0) relevantTopics.add(n.id); });
        
        let changed = true;
        while (changed) {
            changed = false;
            newEdges.forEach(e => {
                if (relevantTopics.has(e.target) && !relevantTopics.has(e.source)) {
                    relevantTopics.add(e.source);
                    changed = true;
                }
            });
        }

        const filteredNodes = newNodes.filter(n => relevantTopics.has(n.id));
        const filteredEdges = newEdges.filter(e => relevantTopics.has(e.source) && relevantTopics.has(e.target));

        let finalNodes = filteredNodes;
        if (liteMode && finalNodes.length > 50) {
            finalNodes = finalNodes.slice().sort((a, b) => b.errorCount - a.errorCount).slice(0, 50);
        }
        const finalNodeIds = new Set(finalNodes.map(n => n.id));
        const finalEdges = filteredEdges.filter(e => finalNodeIds.has(e.source) && finalNodeIds.has(e.target));

        const canvasWidth = containerRef.current?.clientWidth || 800;
        const canvasHeight = containerRef.current?.clientHeight || 600;
        
        finalNodes.forEach(n => {
            const attractor = getAttractor(n.subject, canvasWidth, canvasHeight);
            n.x = attractor.x + (Math.random() - 0.5) * 320;
            n.y = attractor.y + (Math.random() - 0.5) * 320;
        });

        nodesRef.current = finalNodes;
        edgesRef.current = finalEdges;
        
        const map = new Map<string, Node>();
        finalNodes.forEach(n => map.set(n.id, n));
        nodeMapRef.current = map;

        setNodeCount(finalNodes.length);
        setIsStable(false);
        setIsFrozen(false);
        gravityFactorRef.current = 0.003;
    }, [logs, liteMode, selectedSubject]);

    useEffect(() => { initGraph(); }, [initGraph]);

    const drawBackgroundGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Canvas dot grid
        const step = 40;
        ctx.fillStyle = 'rgba(51, 65, 85, 0.4)';
        for (let x = step / 2; x < width; x += step) {
            for (let y = step / 2; y < height; y += step) {
                ctx.beginPath();
                ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    };

    const drawSubjectZones = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        ctx.save();
        const subjects = [
            { name: 'PHYSICS', subject: 'physics', color: COLORS.physics },
            { name: 'CHEMISTRY', subject: 'chemistry', color: COLORS.chemistry },
            { name: 'MATHS', subject: 'maths', color: COLORS.maths },
        ];

        subjects.forEach(sub => {
            const p = getAttractor(sub.subject, width, height);
            const pulse = Math.sin(time * 0.002 + p.x) * 8;
            
            // Faint Zone Ellipse
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 140 + pulse, 100 + pulse, 0, 0, 2 * Math.PI);
            ctx.fillStyle = sub.color;
            ctx.globalAlpha = 0.03;
            ctx.fill();
            ctx.strokeStyle = sub.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.08;
            ctx.stroke();

            // Inter Ghost Label
            ctx.font = '900 64px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = sub.color;
            ctx.globalAlpha = 0.06 + Math.sin(time * 0.0015) * 0.02;
            ctx.fillText(sub.name, p.x, p.y);
        });

        ctx.restore();
    };

    const drawEdges = (ctx: CanvasRenderingContext2D) => {
        const nodeMap = nodeMapRef.current;
        edgesRef.current.forEach(edge => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return;

            if (liteMode) {
                ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5;
            } else {
                const grad = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
                const colorSource = source.errorCount > 0 ? getErrorColor(source.errorCount) : COLORS[source.subject] || COLORS.neutral;
                const colorTarget = target.errorCount > 0 ? getErrorColor(target.errorCount) : COLORS[target.subject] || COLORS.neutral;
                
                grad.addColorStop(0, colorSource);
                grad.addColorStop(1, colorTarget);

                ctx.strokeStyle = grad;
                ctx.lineWidth = (source.errorCount > 0 && target.errorCount > 0) ? 2 : 1.2;
                ctx.globalAlpha = (source.errorCount > 0 && target.errorCount > 0) ? 0.65 : 0.2; 
            }
            
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    };

    const drawNode = (ctx: CanvasRenderingContext2D, node: Node, time: number) => {
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const baseColor = node.errorCount > 0 ? getErrorColor(node.errorCount) : COLORS[node.subject] || COLORS.neutral;

        if (liteMode) {
            ctx.shadowBlur = 0;
            if (node.errorCount > 0) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + 3, 0, 2 * Math.PI);
                ctx.strokeStyle = baseColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        } else {
            // Pulsing glow for error nodes
            if (node.errorCount > 0) {
                const pulseGlow = Math.sin(time * 0.004 + node.phase) * 10 + 25;
                ctx.shadowBlur = isHovered ? 45 : pulseGlow;
                ctx.shadowColor = baseColor;

                // Outer Pulse Ring
                const ringRadius = node.radius + (Math.sin(time * 0.005 + node.phase) + 1) * 4;
                ctx.beginPath();
                ctx.arc(node.x, node.y, ringRadius, 0, 2 * Math.PI);
                ctx.strokeStyle = baseColor;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.4;
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else {
                ctx.shadowBlur = isHovered ? 30 : 12;
                ctx.shadowColor = isHovered ? '#38bdf8' : baseColor;
            }
        }
        
        // Node Radial Gradient
        const grad = ctx.createRadialGradient(
            node.x - node.radius * 0.35, node.y - node.radius * 0.35, node.radius * 0.08,
            node.x, node.y, node.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, baseColor);
        grad.addColorStop(1, '#0b0f19');

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Hover Ring
        if (isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + 3, 0, 2 * Math.PI);
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        // Drilldown Targeting Reticle Animation
        if (interactionMode === 'drilldown' && isHovered) {
            const reticleSize = node.radius + 10;
            const bracketLength = 10;
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Top Left
            ctx.moveTo(node.x - reticleSize, node.y - reticleSize + bracketLength);
            ctx.lineTo(node.x - reticleSize, node.y - reticleSize);
            ctx.lineTo(node.x - reticleSize + bracketLength, node.y - reticleSize);
            // Top Right
            ctx.moveTo(node.x + reticleSize - bracketLength, node.y - reticleSize);
            ctx.lineTo(node.x + reticleSize, node.y - reticleSize);
            ctx.lineTo(node.x + reticleSize, node.y - reticleSize + bracketLength);
            // Bottom Left
            ctx.moveTo(node.x - reticleSize, node.y + reticleSize - bracketLength);
            ctx.lineTo(node.x - reticleSize, node.y + reticleSize);
            ctx.lineTo(node.x - reticleSize + bracketLength, node.y + reticleSize);
            // Bottom Right
            ctx.moveTo(node.x + reticleSize - bracketLength, node.y + reticleSize);
            ctx.lineTo(node.x + reticleSize, node.y + reticleSize);
            ctx.lineTo(node.x + reticleSize, node.y + reticleSize - bracketLength);
            ctx.stroke();
        }

        // Label Pill & Text
        const fontSize = Math.max(11, Math.min(13, 10 + node.radius * 0.08));
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
        const label = node.id;
        const textMetrics = ctx.measureText(label);
        const pillWidth = textMetrics.width + 12;
        const pillHeight = fontSize + 6;

        ctx.fillStyle = 'rgba(11, 15, 25, 0.92)';
        ctx.beginPath();
        ctx.roundRect(node.x - pillWidth / 2, node.y - pillHeight / 2, pillWidth, pillHeight, 6);
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, node.x, node.y + 0.5);

        // Search Query Highlighting Ring
        const query = searchQueryRef.current.trim().toLowerCase();
        const isSearchMatch = query !== '' && node.id.toLowerCase().includes(query);
        if (isSearchMatch) {
            ctx.save();
            ctx.shadowBlur = 24;
            ctx.shadowColor = '#22d3ee';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + 6, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
        }

        // Error Count Badge
        if (node.errorCount > 0) {
            const badgeX = node.x + node.radius * 0.72;
            const badgeY = node.y - node.radius * 0.72;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#dc2626';
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, 11, 0, 2 * Math.PI);
            ctx.fillStyle = '#dc2626';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 10px Inter, system-ui, sans-serif';
            ctx.fillText(node.errorCount.toString(), badgeX, badgeY + 0.5);
        }
    };

    const animate = useCallback(() => {
        timeRef.current += 16;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        drawBackgroundGrid(ctx, width, height);
        drawSubjectZones(ctx, width, height, timeRef.current);
        drawEdges(ctx);

        physicsFrameRef.current++;
        // Physics Engine Update (Throttled to 30fps and halted when frozen or stable)
        if (interactionModeRef.current === 'interact' && !isStableRef.current && !isFrozenRef.current && physicsFrameRef.current % 2 === 0) {
            let maxVelocity = 0;
            const nodes = nodesRef.current;

            // Repulsion & Gravity
            nodes.forEach(node => {
                if (node.isDragging) return;
                let fx = 0, fy = 0;

                nodes.forEach(other => {
                    if (node.id === other.id) return;
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distSq = dx * dx + dy * dy || 1;
                    if (distSq < 250000) {
                        const force = REPULSION / distSq;
                        fx += (dx / Math.sqrt(distSq)) * force;
                        fy += (dy / Math.sqrt(distSq)) * force;
                    }

                    // Collision Avoidance Impulse
                    const minDist = node.radius + other.radius + 15;
                    const dist = Math.sqrt(distSq);
                    if (dist < minDist) {
                        const overlap = minDist - dist;
                        fx += (dx / dist) * overlap * 0.15;
                        fy += (dy / dist) * overlap * 0.15;
                    }
                });

                const attractor = getAttractor(node.subject, width, height);
                fx += (attractor.x - node.x) * gravityFactorRef.current;
                fy += (attractor.y - node.y) * gravityFactorRef.current;

                node.vx = (node.vx + fx) * DAMPING;
                node.vy = (node.vy + fy) * DAMPING;
                node.x += node.vx;
                node.y += node.vy;
                
                const padding = node.radius + 20;
                if (node.x < padding) { node.x = padding; node.vx *= -0.4; }
                if (node.x > width - padding) { node.x = width - padding; node.vx *= -0.4; }
                if (node.y < padding) { node.y = padding; node.vy *= -0.4; }
                if (node.y > height - padding) { node.y = height - padding; node.vy *= -0.4; }

                const velocity = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
                if (velocity > maxVelocity) maxVelocity = velocity;
            });

            // Spring Forces (Prerequisites)
            const nodeMap = nodeMapRef.current;
            edgesRef.current.forEach(edge => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (source && target) {
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const strengthMultiplier = (source.errorCount > 0 || target.errorCount > 0) ? 1.0 : 0.3;
                    const force = (dist - SPRING_LENGTH) * SPRING_STRENGTH * strengthMultiplier;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    if (!source.isDragging) { source.vx += fx; source.vy += fy; }
                    if (!target.isDragging) { target.vx -= fx; target.vy -= fy; }
                }
            });

            // Heat decay for stabilization
            if (gravityFactorRef.current > 0.0005) {
                gravityFactorRef.current *= 0.995;
            }

            if (maxVelocity < STABILITY_THRESHOLD) {
                setIsStable(true);
            }
        }

        nodesRef.current.forEach(node => drawNode(ctx, node, timeRef.current));
        
        // Pause animation frame loop when simulation is stable/frozen and no nodes are being interacted with
        const isDraggingAny = nodesRef.current.some(n => n.isDragging);
        const hasHoveredNode = hoveredNodeRef.current !== null;
        
        if ((isStableRef.current || isFrozenRef.current) && !isDraggingAny && !hasHoveredNode) {
            requestRef.current = null;
            return;
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [liteMode]);

    const wakeUpAnimation = useCallback(() => {
        if (!requestRef.current && isVisible) {
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [animate, isVisible]);

    const toggleFreeze = useCallback(() => {
        setIsFrozen(prev => {
            const next = !prev;
            if (next) {
                setIsStable(true);
                if (requestRef.current) {
                    cancelAnimationFrame(requestRef.current);
                    requestRef.current = null;
                }
            } else {
                setIsStable(false);
                gravityFactorRef.current = 0.003;
                wakeUpAnimation();
            }
            return next;
        });
    }, [wakeUpAnimation]);

    const reheatSimulation = useCallback(() => {
        setIsFrozen(false);
        setIsStable(false);
        gravityFactorRef.current = 0.003;
        nodesRef.current.forEach(n => {
            n.vx = (Math.random() - 0.5) * 6;
            n.vy = (Math.random() - 0.5) * 6;
        });
        wakeUpAnimation();
    }, [wakeUpAnimation]);

    useEffect(() => {
        if (!isVisible) return;
        wakeUpAnimation();
        return () => { if (requestRef.current) { cancelAnimationFrame(requestRef.current); requestRef.current = null; } };
    }, [animate, isVisible, wakeUpAnimation]);

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(() => {
            if (containerRef.current && canvasRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth;
                canvasRef.current.height = containerRef.current.clientHeight;
                setIsStable(false);
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // Pointer & Touch Interaction Handlers
    const getNodeAtPos = (clientX: number, clientY: number) => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        for (let i = nodesRef.current.length - 1; i >= 0; i--) {
            const node = nodesRef.current[i];
            const dx = x - node.x;
            const dy = y - node.y;
            if (dx * dx + dy * dy < node.radius * node.radius) return node;
        }
        return null;
    };

    const handlePointerDown = (clientX: number, clientY: number) => {
        wakeUpAnimation();
        if (interactionModeRef.current === 'drilldown') return;
        const node = getNodeAtPos(clientX, clientY);
        if (node) {
            node.isDragging = true;
            gravityFactorRef.current = 0.003;
            setIsStable(false);
        }
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
        wakeUpAnimation();
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Hover detection
        const hovered = getNodeAtPos(clientX, clientY);
        hoveredNodeRef.current = hovered;
        const nextTopic = hovered ? hovered.id : null;
        if (lastHoveredTopicRef.current !== nextTopic) {
            lastHoveredTopicRef.current = nextTopic;
            setHoveredTopic(nextTopic);
        }

        if (interactionModeRef.current === 'interact') {
            nodesRef.current.forEach(node => {
                if (node.isDragging) {
                    node.x = x;
                    node.y = y;
                    node.vx = 0;
                    node.vy = 0;
                }
            });
        }
    };

    const handlePointerUp = (clientX: number, clientY: number) => {
        nodesRef.current.forEach(node => { if (node.isDragging) node.isDragging = false; });
        
        if (interactionMode === 'drilldown') {
            const clicked = getNodeAtPos(clientX, clientY);
            if (clicked) onNodeClick(clicked.id);
        }
    };

    return (
        <div ref={containerRef} className="flex-grow w-full h-full bg-surface-base rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl flex flex-col">
            {/* Top Status & Subject Filter Bar */}
            <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
                <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs text-slate-300 shadow-lg">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-white font-mono">{nodeCount}</span>
                    <span className="text-slate-400">topics</span>
                </div>

                {/* Subject Isolation Chips */}
                <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-lg">
                    {(['all', 'physics', 'chemistry', 'maths'] as const).map(sub => (
                        <button
                            key={sub}
                            onClick={() => setSelectedSubject(sub)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                                selectedSubject === sub
                                    ? sub === 'physics'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : sub === 'chemistry'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : sub === 'maths'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>

                {/* Status Indicator */}
                <AnimatePresence>
                    {isFrozen ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-cyan-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-cyan-800/50 text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5 shadow-md"
                        >
                            <Snowflake className="w-3 h-3 text-cyan-400" />
                            Frozen (GPU Idled)
                        </motion.div>
                    ) : isStable && interactionMode === 'interact' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-emerald-800/50 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 shadow-md"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Settled
                        </motion.div>
                    ) : !isVisible ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-amber-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-amber-800/50 text-[11px] font-semibold text-amber-400 flex items-center gap-1.5 shadow-md"
                        >
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            Paused
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-indigo-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-indigo-800/50 text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 shadow-md"
                        >
                            <Flame className="w-3 h-3 text-indigo-400 animate-pulse" />
                            Simulating
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Top Right Controls & Topic Search */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                {/* Search Input */}
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Highlight topic..."
                        className="bg-slate-900/90 backdrop-blur-md pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 w-36 sm:w-44 transition-all shadow-xl"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Mode Switcher Buttons */}
                <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
                    <button
                        onClick={() => setInteractionMode('interact')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            interactionMode === 'interact'
                                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/50'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Drag and inspect nodes"
                    >
                        <Hand className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Interact</span>
                    </button>
                    <button
                        onClick={() => setInteractionMode('drilldown')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            interactionMode === 'drilldown'
                                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/50'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title="Click a node to open drill-down details"
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Drill Down</span>
                    </button>
                </div>

                {/* Freeze / Unfreeze Physics Toggle */}
                <button
                    onClick={toggleFreeze}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border shadow-xl backdrop-blur-md transition-all ${
                        isFrozen
                            ? 'bg-cyan-950/90 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/80 shadow-cyan-950/40'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-cyan-300'
                    }`}
                    title={isFrozen ? 'Unfreeze Physics Simulation' : 'Freeze Physics Layout (Saves Battery/GPU)'}
                >
                    {isFrozen ? (
                        <>
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden md:inline">Unfreeze</span>
                        </>
                    ) : (
                        <>
                            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden md:inline">Freeze</span>
                        </>
                    )}
                </button>
            </div>

            {/* Main Interactive Canvas */}
            <canvas
                ref={canvasRef}
                className={`block w-full h-full relative z-0 ${interactionMode === 'interact' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
                onMouseLeave={(e) => { hoveredNodeRef.current = null; setHoveredTopic(null); handlePointerUp(e.clientX, e.clientY); }}
                onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    if (touch) handlePointerUp(touch.clientX, touch.clientY);
                }}
            />

            {/* Bottom-Left Glassmorphism Legend */}
            <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 shadow-xl text-[11px] space-y-1 text-slate-300">
                <div className="flex items-center gap-2 font-bold text-slate-200 uppercase tracking-wider text-[9px] mb-1">
                    <span>Severity Legend</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>
                        <span className="text-slate-300">1-2 Errors</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span>
                        <span className="text-slate-300">3-4 Errors</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-700 shadow-[0_0_6px_rgba(185,28,28,0.8)]"></span>
                        <span className="text-slate-300">5+ Errors</span>
                    </div>
                </div>
            </div>

            {/* Bottom-Right Controls Cluster */}
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                <button
                    onClick={reheatSimulation}
                    className="bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xl"
                    title="Inject kinetic energy and reorganize layout"
                >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Reheat</span>
                </button>
                <button
                    onClick={initGraph}
                    className="bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-slate-300 hover:text-cyan-300 transition-all shadow-xl group"
                    title="Reset Graph Layout"
                >
                    <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                </button>
            </div>
        </div>
    );
};
