
import React from 'react';

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
    if (!isActive) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#1e222d] border border-blue-500 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.3)] p-3 flex flex-col gap-2 min-w-[300px] animate-in slide-in-from-top-4">
            
            {/* Header / Info */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Replay Mode</span>
                </div>
                <div className="text-xs font-mono text-blue-400">
                    {new Date(currentDate * 1000).toLocaleString()}
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-4">
                
                {/* Play/Pause */}
                <button 
                    onClick={onPlayPause}
                    className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-lg"
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                </button>

                {/* Scrubber */}
                <div className="flex-1 flex flex-col justify-center">
                    <input 
                        type="range" 
                        min="0" 
                        max={maxIndex} 
                        value={currentIndex} 
                        onChange={onSeek}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />
                </div>

                {/* Speed Toggle */}
                <button 
                    onClick={onSpeedChange}
                    className="text-xs font-bold font-mono text-gray-300 hover:text-white bg-gray-800 px-2 py-1 rounded border border-gray-600 w-12 text-center"
                    title="Playback Speed"
                >
                    {speed < 200 ? '10x' : speed < 400 ? '5x' : speed < 800 ? '2x' : '1x'}
                </button>

                {/* Exit */}
                <button 
                    onClick={onExit}
                    className="text-gray-500 hover:text-red-400 p-1"
                    title="Exit Replay"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
    );
};
