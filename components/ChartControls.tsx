import React, { useState } from 'react';
import { OverlayState, EntrySignal } from '../types';

interface ChartControlsProps {
    overlays: OverlayState;
    setOverlays: (o: OverlayState) => void;
    setupVisibility: 'ALL' | 'FOCUS' | 'NONE';
    setSetupVisibility: (m: 'ALL' | 'FOCUS' | 'NONE') => void;
    onReload: () => void;
    focusedEntry: EntrySignal | null;
}

export const ChartControls: React.FC<ChartControlsProps> = ({ 
    overlays, setOverlays, setupVisibility, setSetupVisibility, onReload, focusedEntry
}) => {
    const [showLayers, setShowLayers] = useState(false);

    return (
        <div className="absolute top-16 right-4 z-30 flex flex-col gap-3 items-end">
            
            {/* 1. RELOAD BUTTON */}
            <button 
                onClick={onReload} 
                className="w-10 h-10 bg-[#1e222d] hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg shadow-lg border border-[#2a2e39] flex items-center justify-center transition-all"
                title="Reload Data"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
            </button>

            {/* 2. LAYERS MENU */}
            <div className="relative">
                <button 
                    onClick={() => setShowLayers(!showLayers)}
                    className={`w-10 h-10 rounded-lg shadow-lg border flex items-center justify-center transition-all ${showLayers ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1e222d] border-[#2a2e39] text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Visibility Layers"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                </button>

                {showLayers && (
                    <div className="absolute right-12 top-0 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl w-48 p-2 animate-in fade-in slide-in-from-right-5 duration-200">
                        <div className="text-xs font-bold text-gray-500 uppercase px-2 py-1 mb-1">Chart Overlays</div>
                        
                        {/* Setup Visibility Toggle */}
                        <div className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer" onClick={() => {
                             setOverlays({...overlays, historicalTradeLines: !overlays.historicalTradeLines});
                             if(setupVisibility === 'NONE') setSetupVisibility('ALL');
                             else if(setupVisibility === 'ALL' && overlays.historicalTradeLines) setSetupVisibility('NONE');
                        }}>
                            <span className="text-sm text-gray-200">Trade Setups</span>
                            <div className={`w-3 h-3 rounded-full ${overlays.historicalTradeLines && setupVisibility !== 'NONE' ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`}></div>
                        </div>

                        {/* Sessions Toggle */}
                        <div className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer" onClick={() => setOverlays({...overlays, killzones: !overlays.killzones})}>
                            <span className="text-sm text-gray-200">Session Zones</span>
                            <div className={`w-3 h-3 rounded-full ${overlays.killzones ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-600'}`}></div>
                        </div>

                         {/* Structure Toggle */}
                         <div className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer" onClick={() => setOverlays({...overlays, swingStructure: !overlays.swingStructure, internalStructure: !overlays.internalStructure})}>
                            <span className="text-sm text-gray-200">Market Structure</span>
                            <div className={`w-3 h-3 rounded-full ${overlays.swingStructure ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-gray-600'}`}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. FOCUS INDICATOR (ACTIVE) */}
            {setupVisibility === 'FOCUS' && focusedEntry && (
                <div className="relative animate-in fade-in slide-in-from-right-10">
                    <div className="bg-[#1e222d] border border-blue-500 rounded-lg p-3 shadow-xl w-48">
                        <div className="flex justify-between items-start mb-2">
                             <div className="text-[10px] font-bold text-blue-400 uppercase">Focused Setup</div>
                             <button onClick={() => setSetupVisibility('ALL')} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className={`font-bold ${focusedEntry.type === 'LONG' ? 'text-green-400' : 'text-red-400'} text-sm flex items-center gap-2`}>
                            {focusedEntry.type} <span className="text-white font-mono">@ {focusedEntry.price.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">{new Date((focusedEntry.time as number)*1000).toLocaleTimeString()}</div>
                        <button 
                            onClick={() => setSetupVisibility('ALL')}
                            className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-xs py-1 rounded text-white transition-colors"
                        >
                            Show All
                        </button>
                    </div>
                    {/* Connector arrow */}
                    <div className="absolute top-4 -right-1 w-3 h-3 bg-[#1e222d] border-t border-r border-blue-500 transform rotate-45"></div>
                </div>
            )}
        </div>
    );
};