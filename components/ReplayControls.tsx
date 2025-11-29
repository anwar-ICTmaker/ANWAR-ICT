
import React, { useState, useRef, useEffect } from 'react';

interface ReplayControlsProps {
    isActive: boolean;
    isPlaying: boolean;
    speed: number;
    currentIndex: number;
    maxIndex: number;
    currentDate: number;
    onPlayPause: () => void;
    onSpeedChange: () => void;
    onExit: () => void;
    onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
    isActive, isPlaying, speed, currentIndex, maxIndex, currentDate, onPlayPause, onSpeedChange, onExit, onSeek
}) => {
    const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    // Initial position logic
    useEffect(() => {
        if (isActive && !position) {
            // Default position: Centered horizontally, slightly down from top
            setPosition({ x: window.innerWidth / 2 - 170, y: 100 });
        }
    }, [isActive]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (panelRef.current) {
            setIsDragging(true);
            const rect = panelRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                
                // Simple bounds checking to keep somewhat on screen
                const clampedX = Math.max(0, Math.min(window.innerWidth - 300, newX));
                const clampedY = Math.max(0, Math.min(window.innerHeight - 100, newY));

                setPosition({ x: clampedX, y: clampedY });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isActive) return null;

    const progressPercentage = (currentIndex / maxIndex) * 100;
    
    // Determine Speed Level for visuals (1 to 4 bars)
    // 800ms = 1x, 500ms = 2x, 200ms = 5x, 100ms = 10x
    const speedLevel = speed <= 100 ? 4 : speed <= 200 ? 3 : speed <= 500 ? 2 : 1;
    const speedLabel = speed <= 100 ? '10x' : speed <= 200 ? '5x' : speed <= 500 ? '2x' : '1x';

    return (
        <div 
            ref={panelRef}
            style={{ 
                left: position ? position.x : '50%', 
                top: position ? position.y : '100px',
                transform: position ? 'none' : 'translateX(-50%)',
                position: 'fixed' // Ensure fixed positioning for reliable dragging
            }}
            className="z-[90] bg-[#1e222d]/95 backdrop-blur-sm border border-blue-500 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.3)] p-3 flex flex-col gap-2 min-w-[340px] animate-in fade-in zoom-in-95"
        >
            <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2px solid #3b82f6;
                    margin-top: -6px;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                    cursor: pointer;
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 4px;
                    cursor: pointer;
                    border-radius: 2px;
                }
            `}</style>
            
            {/* Header / Info - DRAG HANDLE */}
            <div 
                className="flex justify-between items-center border-b border-gray-700 pb-2 mb-1 cursor-move select-none"
                onMouseDown={handleMouseDown}
                title="Click and drag to move"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Replay Mode</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-xs font-mono text-blue-400 pointer-events-none font-bold">
                        {new Date(currentDate * 1000).toLocaleString()}
                    </div>
                    {/* Drag Icon */}
                    <svg className="text-gray-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-4">
                
                {/* Play/Pause */}
                <button 
                    onClick={onPlayPause}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-lg shrink-0 border ${isPlaying ? 'bg-yellow-500 border-yellow-400 hover:bg-yellow-400 text-black' : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white'}`}
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                </button>

                {/* Scrubber */}
                <div className="flex-1 flex flex-col justify-center relative">
                    <input 
                        type="range" 
                        min="0" 
                        max={maxIndex} 
                        value={currentIndex} 
                        onChange={onSeek}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #3b82f6 ${progressPercentage}%, #374151 ${progressPercentage}%)`
                        }}
                    />
                </div>

                {/* Speed Toggle */}
                <button 
                    onClick={onSpeedChange}
                    className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 transition-colors shrink-0 group"
                    title="Playback Speed"
                >
                    <div className="flex flex-col gap-[2px] items-end justify-center h-4">
                         {/* Visual Speed Bars */}
                         <div className={`w-3 h-0.5 rounded-full transition-all ${speedLevel >= 4 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                         <div className={`w-2.5 h-0.5 rounded-full transition-all ${speedLevel >= 3 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                         <div className={`w-2 h-0.5 rounded-full transition-all ${speedLevel >= 2 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                         <div className={`w-1.5 h-0.5 rounded-full transition-all ${speedLevel >= 1 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                    </div>
                    <span className="text-xs font-bold font-mono text-gray-300 group-hover:text-white w-6 text-right">
                        {speedLabel}
                    </span>
                </button>

                {/* Exit */}
                <button 
                    onClick={onExit}
                    className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded shrink-0 transition-colors"
                    title="Exit Replay"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
    );
};
