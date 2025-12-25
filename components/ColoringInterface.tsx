
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UndoIcon, RedoIcon, EraserIcon, BrushIcon, FillBucketIcon, MoveIcon, ZoomInIcon, ZoomOutIcon, CheckIcon, ArrowLeftIcon } from './Icons';
// Import the worker using Vite's syntax
import FillWorker from '../src/workers/fill.worker?worker';
import VectorWorker from '../src/workers/vectorizer.worker?worker';

interface ColoringInterfaceProps {
    imageUrl: string;
    initialState?: string;
    onSave: (dataUrl: string) => Promise<void> | void;
    onClose: () => void;
    isViralCTA?: boolean;
}

const PRESET_COLORS = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#78350f', '#57534e', '#94a3b8', '#1e293b'
];

export const ColoringInterface: React.FC<ColoringInterfaceProps> = ({ imageUrl, initialState, onSave, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const colorCanvasRef = useRef<HTMLCanvasElement>(null);
    const lineCanvasRef = useRef<HTMLCanvasElement>(null);
    const workerRef = useRef<Worker | null>(null);

    const [tool, setTool] = useState<'brush' | 'fill' | 'eraser' | 'move'>('fill');
    const [color, setColor] = useState('#ef4444');
    const [brushSize, setBrushSize] = useState(30);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

    // UI State for History (for buttons)
    const [history, setHistory] = useState<ArrayBuffer[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // CRITICAL REFS: For internal logic to avoid stale closures in worker callbacks
    const historyRef = useRef<ArrayBuffer[]>([]);
    const historyIndexRef = useRef(-1);

    const [isProcessing, setIsProcessing] = useState(false);

    // CRITICAL: Refs for seamless worker recovery
    const maskDataRef = useRef<{ width: number, height: number, buffer: ArrayBuffer } | null>(null);
    const fillTimeoutIdRef = useRef<any>(null);
    const vectorWorkerRef = useRef<Worker | null>(null);

    const [isVectorizing, setIsVectorizing] = useState(false);

    // Initial Save Helper
    // We separate this to avoid circular dependencies in initWorker
    const saveToHistory = useCallback(() => {
        const ctx = colorCanvasRef.current?.getContext('2d', { willReadFrequently: true });
        if (!ctx || !colorCanvasRef.current) return;

        const data = ctx.getImageData(0, 0, colorCanvasRef.current.width, colorCanvasRef.current.height);
        const buffer = data.data.buffer.slice(0); // Clone buffer

        // Use refs for atomic updates
        const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
        nextHistory.push(buffer);

        // Limit to 50
        const limitedHistory = nextHistory.slice(-50);

        historyRef.current = limitedHistory;
        historyIndexRef.current = limitedHistory.length - 1;

        // Sync to React state for UI updates
        setHistory(limitedHistory);
        setHistoryIndex(limitedHistory.length - 1);
    }, []);

    const initWorker = useCallback(() => {
        // Use the imported implementation
        workerRef.current = new FillWorker();

        // If we simply restarted the worker, restore its state immediately
        if (maskDataRef.current) {
            const { width, height, buffer } = maskDataRef.current;
            // Copy buffer to send to worker
            const bufferCopy = buffer.slice(0);
            workerRef.current.postMessage({ type: 'INIT', width, height, maskData: bufferCopy }, [bufferCopy]);
        }

        workerRef.current.onmessage = (e) => {
            // Success! Clear the watchdog timeout.
            if (fillTimeoutIdRef.current) {
                clearTimeout(fillTimeoutIdRef.current);
                fillTimeoutIdRef.current = null;
            }

            setIsProcessing(false);

            if (e.data.error) {
                console.error("Worker Error:", e.data.error);
                return;
            }

            if (e.data.changed && colorCanvasRef.current) {
                const ctx = colorCanvasRef.current.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                    const imgData = new ImageData(new Uint8ClampedArray(e.data.buffer), colorCanvasRef.current.width, colorCanvasRef.current.height);
                    ctx.putImageData(imgData, 0, 0);
                    // This calls the Ref-based save, avoiding stale closures
                    saveToHistory();
                }
            }
        };

        workerRef.current.onerror = (e) => {
            console.error("Worker crashed:", e);
            setIsProcessing(false);
        };
    }, [saveToHistory]); // Dependency on saveToHistory is fine as it uses refs and doesn't change

    useEffect(() => {
        initWorker();
        // Cleanup on unmount
        return () => {
            if (fillTimeoutIdRef.current) clearTimeout(fillTimeoutIdRef.current);
            workerRef.current?.terminate();
        };
    }, [initWorker]);

    // Handle Image Loading & Canvas Setup
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const colorCanvas = colorCanvasRef.current;
            const lineCanvas = lineCanvasRef.current;
            if (!colorCanvas || !lineCanvas) return;

            const maxDim = 1024; // Limit resolution for performance stability
            const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);

            // CRITICAL: Force integers to prevents floating-point indexing bugs in BFS
            const w = Math.floor(img.width * scale);
            const h = Math.floor(img.height * scale);

            colorCanvas.width = lineCanvas.width = w;
            colorCanvas.height = lineCanvas.height = h;

            const cCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
            const lCtx = lineCanvas.getContext('2d', { willReadFrequently: true });
            if (!cCtx || !lCtx) return;

            // Fill background white
            cCtx.fillStyle = '#ffffff';
            cCtx.fillRect(0, 0, w, h);

            // Load initial state if present (e.g. continuing work)
            if (initialState) {
                const saved = new Image();
                saved.crossOrigin = "anonymous";
                saved.src = initialState;
                saved.onload = () => {
                    cCtx.drawImage(saved, 0, 0, w, h);
                    saveToHistory();
                };
                saved.onerror = () => saveToHistory();
            } else {
                saveToHistory();
            }

            // Draw line art to separate layer
            lCtx.drawImage(img, 0, 0, w, h);

            // Extract mask logic
            const maskData = lCtx.getImageData(0, 0, w, h);

            // Store mask data in ref for worker restarts
            const bufferForWorker = maskData.data.buffer.slice(0);
            const bufferForRef = maskData.data.buffer.slice(0);
            maskDataRef.current = { width: w, height: h, buffer: bufferForRef };

            workerRef.current?.postMessage({
                type: 'INIT',
                width: w,
                height: h,
                maskData: bufferForWorker
            }, [bufferForWorker]);

            centerCanvas();
        };
    }, [imageUrl, saveToHistory]);

    useEffect(() => {
        vectorWorkerRef.current = new VectorWorker();
        vectorWorkerRef.current.onmessage = (e) => {
            const { svg, elapsed } = e.data;
            setIsVectorizing(false);
            if (svg) {
                const blob = new Blob([svg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `childtale_vector_${Date.now()}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                // We use a non-blocking notification here or just let the download happen
                console.log(`Vector export complete in ${elapsed}ms`);
            }
        };
        return () => { vectorWorkerRef.current?.terminate(); };
    }, []);

    const handleVectorExport = () => {
        if (!lineCanvasRef.current || isVectorizing) return;
        setIsVectorizing(true);
        const ctx = lineCanvasRef.current.getContext('2d');
        if (ctx) {
            const data = ctx.getImageData(0, 0, lineCanvasRef.current.width, lineCanvasRef.current.height);
            vectorWorkerRef.current?.postMessage({
                imageData: data,
                width: lineCanvasRef.current.width,
                height: lineCanvasRef.current.height,
                options: { scale: 2.0, threshold: 200 }
            });
        }
    };

    const undo = () => {
        // Use Refs for source of truth
        if (historyIndexRef.current > 0 && colorCanvasRef.current) {
            const prevIdx = historyIndexRef.current - 1;
            const ctx = colorCanvasRef.current.getContext('2d');
            const buffer = historyRef.current[prevIdx];

            if (ctx && buffer) {
                // Restore pixel data
                const data = new ImageData(new Uint8ClampedArray(buffer), colorCanvasRef.current.width, colorCanvasRef.current.height);
                ctx.putImageData(data, 0, 0);

                // Update pointers
                historyIndexRef.current = prevIdx;
                setHistoryIndex(prevIdx);
            }
        }
    };

    const redo = () => {
        // Use Refs for source of truth
        if (historyIndexRef.current < historyRef.current.length - 1 && colorCanvasRef.current) {
            const nextIdx = historyIndexRef.current + 1;
            const ctx = colorCanvasRef.current.getContext('2d');
            const buffer = historyRef.current[nextIdx];

            if (ctx && buffer) {
                // Restore pixel data
                const data = new ImageData(new Uint8ClampedArray(buffer), colorCanvasRef.current.width, colorCanvasRef.current.height);
                ctx.putImageData(data, 0, 0);

                // Update pointers
                historyIndexRef.current = nextIdx;
                setHistoryIndex(nextIdx);
            }
        }
    };

    const centerCanvas = () => {
        if (!containerRef.current || !colorCanvasRef.current) return;
        const container = containerRef.current;
        const canvas = colorCanvasRef.current;
        const scale = Math.min((container.clientWidth - 40) / canvas.width, (container.clientHeight - 240) / canvas.height, 1);
        setTransform({ x: 0, y: 0, scale });
    };

    const getCanvasCoords = (clientX: number, clientY: number) => {
        const canvas = colorCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const isDragging = useRef(false);
    const lastPtr = useRef({ x: 0, y: 0 });

    const onStart = (e: any) => {
        const ptr = e.touches ? e.touches[0] : e;
        isDragging.current = true;
        lastPtr.current = { x: ptr.clientX, y: ptr.clientY };
        if (tool === 'move') return;

        const coords = getCanvasCoords(ptr.clientX, ptr.clientY);

        if (tool === 'fill') {
            if (!colorCanvasRef.current) return;
            // PREVENT WORKER SPAM: Check bounds before sending
            if (coords.x < 0 || coords.y < 0 || coords.x >= colorCanvasRef.current.width || coords.y >= colorCanvasRef.current.height) {
                return;
            }

            if (isProcessing) return;
            setIsProcessing(true);

            // TIMEOUT WATCHDOG: 15 seconds
            fillTimeoutIdRef.current = setTimeout(() => {
                setIsProcessing(prev => {
                    if (prev) {
                        console.warn("Fill timeout - restarting worker (15s limit reached)");
                        workerRef.current?.terminate();
                        initWorker(); // Restart & Restore State
                        return false;
                    }
                    return false;
                });
            }, 15000);

            try {
                const ctx = colorCanvasRef.current?.getContext('2d', { willReadFrequently: true });
                if (ctx && workerRef.current) {
                    const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                    // Pass buffer to worker
                    workerRef.current.postMessage({
                        type: 'FILL',
                        buffer: data.data.buffer,
                        startX: coords.x,
                        startY: coords.y,
                        fillColorHex: color
                    }, [data.data.buffer]);
                } else {
                    setIsProcessing(false);
                }
            } catch (e) {
                console.error(e);
                setIsProcessing(false);
            }
        } else {
            // Brush / Eraser Logic
            const ctx = colorCanvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = brushSize;
                ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
                ctx.beginPath();
                ctx.moveTo(coords.x, coords.y);
                ctx.stroke();
            }
        }
    };

    const onMove = (e: any) => {
        if (!isDragging.current) return;
        const ptr = e.touches ? e.touches[0] : e;
        if (tool === 'move') {
            const dx = ptr.clientX - lastPtr.current.x;
            const dy = ptr.clientY - lastPtr.current.y;
            setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
        } else if (tool === 'brush' || tool === 'eraser') {
            const ctx = colorCanvasRef.current?.getContext('2d');
            if (ctx) {
                const start = getCanvasCoords(lastPtr.current.x, lastPtr.current.y);
                const end = getCanvasCoords(ptr.clientX, ptr.clientY);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = brushSize;
                ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            }
        }
        lastPtr.current = { x: ptr.clientX, y: ptr.clientY };
    };

    const onEnd = () => {
        if (isDragging.current && (tool === 'brush' || tool === 'eraser')) saveToHistory();
        isDragging.current = false;
    };

    const handleFinalSave = () => {
        if (!colorCanvasRef.current || !lineCanvasRef.current) return;
        if (isProcessing) return; // Prevent double clicks

        // Visual feedback
        setIsProcessing(true);

        setTimeout(async () => {
            try {
                const final = document.createElement('canvas');
                final.width = colorCanvasRef.current!.width;
                final.height = colorCanvasRef.current!.height;
                const fCtx = final.getContext('2d');
                if (fCtx) {
                    // 1. Draw colors
                    fCtx.drawImage(colorCanvasRef.current!, 0, 0);
                    // 2. Draw lines with Multiply to preserve black lines over colors
                    fCtx.globalCompositeOperation = 'multiply';
                    fCtx.drawImage(lineCanvasRef.current!, 0, 0);
                    // 3. Reset
                    fCtx.globalCompositeOperation = 'source-over';

                    // Await the save operation to keep spinner active until unmount/close
                    await onSave(final.toDataURL('image/png'));
                }
            } catch (err) {
                console.error("Save failed:", err);
                setIsProcessing(false); // Only reset on error
            }
        }, 50);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col h-[100svh] overflow-hidden select-none touch-none animate-fade-in">
            <nav className="h-14 px-4 bg-slate-900 flex items-center justify-between shrink-0 z-50">
                <button onClick={onClose} className="flex items-center gap-2 text-white/70 font-bold hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" /> <span>Quit</span>
                </button>
                <button onClick={handleFinalSave} disabled={isProcessing} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-sm shadow-xl flex items-center gap-2 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" /> : <CheckIcon className="w-4 h-4" />}
                    <span>{isProcessing ? 'Saving...' : 'Save Masterpiece'}</span>
                </button>
            </nav>

            <div
                ref={containerRef}
                className="flex-grow relative flex items-center justify-center overflow-hidden bg-slate-800"
                onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
                onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
            >
                <div className="shadow-2xl bg-white touch-none relative transition-transform duration-75 origin-center"
                    style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, width: colorCanvasRef.current?.width ? `${colorCanvasRef.current.width}px` : 'auto', height: colorCanvasRef.current?.height ? `${colorCanvasRef.current.height}px` : 'auto' }}>
                    <canvas ref={colorCanvasRef} className="block cursor-crosshair" />
                    <canvas ref={lineCanvasRef} className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'multiply' }} />
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
                            <div className="bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-pulse">
                                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">Applying...</span>
                            </div>
                        </div>
                    )}
                    {isVectorizing && (
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
                            <div className="bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-pulse">
                                <div className="w-5 h-5 border-2 border-fuchsia-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-black text-fuchsia-600 uppercase tracking-widest">Vectorizing...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute right-6 top-6 flex flex-col gap-3 z-40 opacity-50 hover:opacity-100 transition-opacity">
                    <button onClick={handleVectorExport} disabled={isVectorizing} className="p-3 bg-fuchsia-600 text-white rounded-full border-2 border-white shadow-lg hover:bg-fuchsia-700 transition-colors group relative">
                        <span className="absolute right-full mr-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">Download Vector (SVG)</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                    <button onClick={() => setTransform(t => ({ ...t, scale: Math.min(8, t.scale * 1.3) }))} className="p-3 bg-white/10 backdrop-blur text-white rounded-full border border-white/20"><ZoomInIcon className="w-6 h-6" /></button>
                    <button onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.05, t.scale / 1.3) }))} className="p-3 bg-white/10 backdrop-blur text-white rounded-full border border-white/20"><ZoomOutIcon className="w-6 h-6" /></button>
                    <button onClick={centerCanvas} className="p-3 bg-white/10 backdrop-blur text-white rounded-full border border-white/20"><MoveIcon className="w-6 h-6" /></button>
                </div>
            </div>

            <div className="bg-slate-900 border-t border-white/10 p-4 pb-6 z-50 flex flex-col gap-4">
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                    <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden relative shadow-inner shrink-0" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                    </div>
                    {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => setColor(c)} className={`w-12 h-12 rounded-full border-2 transition-all transform active:scale-90 shrink-0 ${color === c ? 'border-white scale-110 shadow-lg' : 'border-white/10'}`} style={{ backgroundColor: c }} />
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 rounded-2xl p-1 shrink-0">
                        <button onClick={undo} disabled={historyIndex <= 0} className="p-3 text-white disabled:opacity-20"><UndoIcon className="w-6 h-6" /></button>
                        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-3 text-white disabled:opacity-20"><RedoIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-grow flex bg-white/5 rounded-2xl p-1 gap-1">
                        <button onClick={() => setTool('brush')} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${tool === 'brush' ? 'bg-indigo-600 text-white' : 'text-white/40'}`}><BrushIcon className="w-5 h-5" /><span className="text-[9px] font-black uppercase">Brush</span></button>
                        <button onClick={() => setTool('fill')} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${tool === 'fill' ? 'bg-indigo-600 text-white' : 'text-white/40'}`}><FillBucketIcon className="w-5 h-5" /><span className="text-[9px] font-black uppercase">Fill</span></button>
                        <button onClick={() => setTool('eraser')} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-white/40'}`}><EraserIcon className="w-5 h-5" /><span className="text-[9px] font-black uppercase">Eraser</span></button>
                        <button onClick={() => setTool('move')} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${tool === 'move' ? 'bg-indigo-600 text-white' : 'text-white/40'}`}><MoveIcon className="w-5 h-5" /><span className="text-[9px] font-black uppercase">Move</span></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
