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
    const [activePopup, setActivePopup] = useState<string | null>(null);

    const togglePopup = (name: string) => {
        if (activePopup === name) setActivePopup(null);
        else setActivePopup(name);
    };

    return (
        <div className="absolute top-4 right-14 z-30 flex flex-col gap-2 items-end">
            
            {/* TOOLBAR CONTAINER */}
            <div className="flex flex-col bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl p-1 gap-1">
                
                {/* 1. RELOAD */}
                <button 
                    onClick={onReload} 
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
                    title="Reload Data"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                </button>
                
                <div className="h-[1px] bg-gray-700 mx-2"></div>

                {/* 2. LAYERS MENU TRIGGER */}
                <div className="relative">
                    <button 
                        onClick={() => togglePopup('LAYERS')}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-all ${activePopup === 'LAYERS' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                        title="Visibility Layers"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    </button>

                    {/* LAYERS POPUP */}
                    {activePopup === 'LAYERS' && (
                        <div className="absolute right-10 top-0 bg-[#1e222d] border border-[#2a2e39] rounded shadow-xl w-56 py-2 z-50">
                            <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Chart Visibility</div>
                            
                            {/* Toggle: Setups */}
                            <div 
                                className="flex items-center justify-between px-4 py-2 hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => {
                                    setOverlays({...overlays, historicalTradeLines: !overlays.historicalTradeLines});
                                    // Logic to ensure we don't end up in weird state
                                    if(setupVisibility === 'NONE') setSetupVisibility('ALL');
                                    else if(setupVisibility === 'ALL' && overlays.historicalTradeLines) setSetupVisibility('NONE');
                                }}
                            >
                                <span className="text-sm text-gray-300">Trade Setups</span>
                                <div className={`relative w-8 h-4 rounded-full transition-colors ${overlays.historicalTradeLines && setupVisibility !== 'NONE' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${overlays.historicalTradeLines && setupVisibility !== 'NONE' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                            {/* Toggle: Sessions */}
                            <div 
                                className="flex items-center justify-between px-4 py-2 hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => setOverlays({...overlays, killzones: !overlays.killzones})}
                            >
                                <span className="text-sm text-gray-300">Session Zones</span>
                                <div className={`relative w-8 h-4 rounded-full transition-colors ${overlays.killzones ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${overlays.killzones ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                             {/* Toggle: Structure */}
                             <div 
                                className="flex items-center justify-between px-4 py-2 hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => setOverlays({...overlays, swingStructure: !overlays.swingStructure, internalStructure: !overlays.internalStructure})}
                            >
                                <span className="text-sm text-gray-300">Market Structure</span>
                                <div className={`relative w-8 h-4 rounded-full transition-colors ${overlays.swingStructure ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${overlays.swingStructure ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-gray-700 mx-4 my-2"></div>
                            
                            <div className="px-4 py-1">
                                <button 
                                    className="text-xs text-blue-400 hover:text-white w-full text-left"
                                    onClick={() => { setSetupVisibility('ALL'); setActivePopup(null); }}
                                >
                                    Reset View
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. FOCUS STATUS (Floating below toolbar) */}
            {setupVisibility === 'FOCUS' && focusedEntry && (
                <div className="bg-[#1e222d] border border-blue-500 rounded p-3 shadow-xl w-48 mt-2 animate-in fade-in slide-in-from-right-5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-blue-400 uppercase">Focus Mode</span>
                        <button 
                            onClick={() => setSetupVisibility('ALL')}
                            className="text-gray-400 hover:text-white bg-gray-800 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                        >✕</button>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${focusedEntry.type === 'LONG' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-white font-bold text-sm">{focusedEntry.type}</span>
                        <span className="text-gray-400 text-xs font-mono">@{focusedEntry.price.toFixed(2)}</span>
                    </div>
                     <button 
                        onClick={() => setSetupVisibility('ALL')}
                        className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 rounded transition-colors"
                    >
                        Exit Focus
                    </button>
                </div>
            )}

        </div>
    );
};