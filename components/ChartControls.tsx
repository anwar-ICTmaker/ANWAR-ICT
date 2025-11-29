
import React from 'react';
import { OverlayState } from '../types';

interface ChartControlsProps {
    overlays: OverlayState;
    setOverlays: (o: OverlayState) => void;
    setupVisibility: 'ALL' | 'FOCUS' | 'NONE';
    setSetupVisibility: (m: 'ALL' | 'FOCUS' | 'NONE') => void;
    onReload: () => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({ 
    overlays, setOverlays, setupVisibility, setSetupVisibility, onReload 
}) => {
    
    const cycleSetupMode = () => {
        if (setupVisibility === 'ALL') setSetupVisibility('NONE');
        else if (setupVisibility === 'NONE') setSetupVisibility('ALL');
        else if (setupVisibility === 'FOCUS') setSetupVisibility('ALL');
    };

    return (
        <div className="absolute top-4 right-16 z-20 flex items-center gap-2">
            <button 
                onClick={() => {
                    setOverlays({...overlays, historicalTradeLines: !overlays.historicalTradeLines});
                    cycleSetupMode();
                }}
                className={`flex flex-col items-center justify-center px-3 py-1.5 rounded border transition-colors backdrop-blur-sm shadow-sm min-w-[70px]
                    ${setupVisibility !== 'NONE' && overlays.historicalTradeLines ? 'bg-blue-600/90 border-blue-400 text-white' : 'bg-gray-800/90 border-gray-600 text-gray-400'}
                `}
            >
                <span className="text-[10px] font-bold tracking-wider">SETUPS</span>
                <span className="text-xs font-bold leading-none">{setupVisibility === 'FOCUS' ? 'FOCUS' : setupVisibility === 'ALL' ? 'ON' : 'OFF'}</span>
            </button>
            
            <button 
                onClick={() => setOverlays({...overlays, killzones: !overlays.killzones})}
                className={`flex flex-col items-center justify-center px-3 py-1.5 rounded border transition-colors backdrop-blur-sm shadow-sm min-w-[70px]
                     ${overlays.killzones ? 'bg-purple-600/90 border-purple-400 text-white' : 'bg-gray-800/90 border-gray-600 text-gray-400'}
                `}
            >
                <span className="text-[10px] font-bold tracking-wider">SESSIONS</span>
                <span className="text-xs font-bold leading-none">{overlays.killzones ? 'ON' : 'OFF'}</span>
            </button>
            
            <button 
                onClick={onReload} 
                className="flex flex-col items-center justify-center px-3 py-1.5 rounded bg-gray-700/90 hover:bg-gray-600/90 text-white border border-gray-500 backdrop-blur-sm transition-colors min-w-[70px]"
            >
                <span className="text-[10px] font-bold tracking-wider">DATA</span>
                <span className="text-xs font-bold leading-none">RELOAD</span>
            </button>
        </div>
    );
};
