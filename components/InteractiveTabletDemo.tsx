import React, { useRef, useEffect, useState } from 'react';
import { SparklesIcon, MagicIcon, FillBucketIcon, BrushIcon, UndoIcon, RedoIcon, XIcon } from './Icons';

export const InteractiveTabletDemo: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokeCount, setStrokeCount] = useState(0);
    const [color, setColor] = useState('#ef4444');
    const [tool, setTool] = useState<'brush' | 'fill'>('fill');
    const [hasStarted, setHasStarted] = useState(false);
    const [showCTA, setShowCTA] = useState(true);

    // History State
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const PRESET_COLORS = [
        { hex: '#ef4444', label: 'Red' },
        { hex: '#3b82f6', label: 'Blue' },
        { hex: '#eab308', label: 'Yellow' },
        { hex: '#22c55e', label: 'Green' },
        { hex: '#a855f7', label: 'Purple' }
    ];

    const saveHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const newState = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // If we are in the middle of history, discard future states
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);

        // Limit history size to 20 steps
        if (newHistory.length > 20) {
            newHistory.shift();
        } else {
            // Only increment index if we didn't shift
        }

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const img = new Image();
        img.src = '/hero-child.png';
        img.onload = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Save initial state
                saveHistory();
            }
        };
    }, []);

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.putImageData(history[newIndex], 0, 0);
            }
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.putImageData(history[newIndex], 0, 0);
            }
        }
    };

    const floodFill = (startX: number, startY: number, fillColor: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        const xIdx = Math.floor(startX);
        const yIdx = Math.floor(startY);
        const startPos = (yIdx * width + xIdx) * 4;

        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];

        const r = parseInt(fillColor.slice(1, 3), 16);
        const g = parseInt(fillColor.slice(3, 5), 16);
        const b = parseInt(fillColor.slice(5, 7), 16);

        if (r === startR && g === startG && b === startB) return;

        const stack: [number, number][] = [[xIdx, yIdx]];
        const visited = new Uint8Array(width * height);

        while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            const pos = (y * width + x) * 4;

            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (visited[y * width + x]) continue;
            visited[y * width + x] = 1;

            const dr = Math.abs(data[pos] - startR);
            const dg = Math.abs(data[pos + 1] - startG);
            const db = Math.abs(data[pos + 2] - startB);

            if (dr + dg + db < 65) { // Reset to normal tolerance for clean line art
                data[pos] = r;
                data[pos + 1] = g;
                data[pos + 2] = b;
                data[pos + 3] = 255;

                stack.push([x + 1, y]);
                stack.push([x - 1, y]);
                stack.push([x, y + 1]);
                stack.push([x, y - 1]);
            }
        }

        ctx.putImageData(imageData, 0, 0);
        setStrokeCount(prev => prev + 15);

        // Save state after fill
        saveHistory();
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const onStart = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) e.preventDefault(); // Prevent scrolling on touch
        setHasStarted(true);
        const { x, y } = getPos(e);

        if (tool === 'fill') {
            floodFill(x, y, color);
        } else {
            setIsDrawing(true);
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineWidth = 15;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = color;
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
    };

    const onMove = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) e.preventDefault(); // Prevent scrolling on touch
        if (!isDrawing || tool !== 'brush') return;
        const { x, y } = getPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
            if (strokeCount < 100) setStrokeCount(prev => prev + 1);
        }
    };

    const onEnd = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveHistory();
        }
    };

    return (
        <div className="w-full h-full relative group cursor-crosshair overflow-hidden rounded-[1.5rem] bg-white">
            <canvas
                ref={canvasRef}
                onMouseDown={onStart}
                onMouseMove={onMove}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
                onTouchStart={onStart}
                onTouchMove={onMove}
                onTouchEnd={onEnd}
                className="w-full h-full block"
            />

            {!hasStarted && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none animate-fade-in z-20">
                    <div className="bg-white/95 p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-bounce-soft border border-white/20">
                        <div className="bg-orange-100 p-2 rounded-xl">
                            <MagicIcon className="w-6 h-6 text-[#FF721F]" />
                        </div>
                        <span className="font-black text-slate-900 uppercase tracking-widest text-sm">Tap to Color!</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-30 pointer-events-none">
                <div className="flex flex-col gap-2 pointer-events-auto">
                    <button
                        onClick={() => setTool('brush')}
                        className={`p-3 rounded-2xl shadow-xl border transition-all transform active:scale-95 ${tool === 'brush' ? 'bg-[#FF721F] text-white border-[#FF721F]' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                        title="Brush Tool"
                    >
                        <BrushIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setTool('fill')}
                        className={`p-3 rounded-2xl shadow-xl border transition-all transform active:scale-95 ${tool === 'fill' ? 'bg-[#FF721F] text-white border-[#FF721F]' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                        title="Magic Fill Tool"
                    >
                        <FillBucketIcon className="w-5 h-5" />
                    </button>

                    {/* Undo/Redo Controls */}
                    <div className="flex gap-1 mt-2">
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className={`p-2 rounded-xl border transition-all ${historyIndex > 0 ? 'bg-white text-slate-600 shadow-md hover:bg-slate-50' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}
                            title="Undo"
                        >
                            <UndoIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            className={`p-2 rounded-xl border transition-all ${historyIndex < history.length - 1 ? 'bg-white text-slate-600 shadow-md hover:bg-slate-50' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}
                            title="Redo"
                        >
                            <RedoIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-100 flex gap-2 pointer-events-auto transition-transform duration-500 group-hover:scale-105">
                    {PRESET_COLORS.map(c => (
                        <button
                            key={c.hex}
                            onClick={() => setColor(c.hex)}
                            className={`w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 active:scale-90 ${color === c.hex ? 'border-slate-800 scale-110' : 'border-white'}`}
                            style={{ backgroundColor: c.hex }}
                        />
                    ))}
                </div>
            </div>

            {strokeCount > 50 && showCTA && (
                <div className="absolute top-4 left-4 right-4 animate-fade-in-up z-30">
                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-[1.5rem] shadow-2xl flex flex-col gap-4 items-center text-center border border-white/10 relative">
                        <button
                            onClick={() => setShowCTA(false)}
                            className="absolute top-3 right-3 p-1.5 text-white/40 hover:text-white transition-colors"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                        <div>
                            <p className="font-black text-[10px] uppercase tracking-[0.2em] text-[#FF721F] mb-1">Incredible talent!</p>
                            <p className="font-black text-sm leading-tight uppercase tracking-tight">This is just 5 colors...</p>
                            <p className="text-xs text-slate-300 mt-2 font-bold">The full Magic Studio has 20+ colors, advanced tools, and your child as the star!</p>
                        </div>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="w-full bg-[#FF721F] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#FF853A] transition-all shadow-lg active:scale-95"
                        >
                            Explore the Full Magic →
                        </button>
                    </div>
                </div>
            )}

            {!hasStarted && (
                <div className="absolute top-4 right-4 pointer-events-none z-10">
                    <SparklesIcon className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
            )}
        </div>
    );
};
