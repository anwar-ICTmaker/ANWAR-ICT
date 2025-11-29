
import React from 'react';
import { StructurePoint, EntrySignal } from '../../types';

interface ScannerPanelProps {
    structure: StructurePoint[];
    entries: EntrySignal[];
    setClickedEntry: (e: EntrySignal) => void;
    onDeepScan?: () => void;
    isScanning?: boolean;
    onClose: () => void;
}

export const ScannerPanel: React.FC<ScannerPanelProps> = ({ structure, entries, setClickedEntry, onDeepScan, isScanning }) => {
    return (
        <div className="h-full flex flex-col bg-[#151924]">
            <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center shrink-0">
                <h2 className="font-bold text-white">Market Scanner</h2>
                <div className="text-xs text-gray-500 font-mono">LIVE</div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
                <div className="mb-6">
                     <div className="text-xs font-bold text-gray-500 uppercase mb-2">Market Condition</div>
                     <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] flex justify-between items-center">
                        <span className="text-sm text-gray-400">Trend</span>
                        <span className={`text-sm font-bold ${structure[structure.length-1]?.direction === 'Bullish' ? 'text-green-500' : 'text-red-500'}`}>
                            {structure[structure.length-1]?.direction || 'Neutral'}
                        </span>
                     </div>
                </div>

                {onDeepScan && (
                    <button 
                        onClick={onDeepScan} 
                        disabled={isScanning}
                        className={`w-full mb-6 p-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all ${isScanning ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
                    >
                        {isScanning ? 'Analyzing...' : 'Run Deep Scan (AI)'}
                    </button>
                )}

                <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex justify-between">
                        <span>Recent Signals</span>
                        <span>{entries.length} Total</span>
                    </div>
                    <div className="space-y-2">
                        {entries.slice(-10).reverse().map((entry, i) => (
                            <div key={i} className="group p-3 bg-[#0b0e11] rounded border border-[#2a2e39] hover:border-blue-500 cursor-pointer transition-colors" onClick={() => setClickedEntry(entry)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${entry.type === 'LONG' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                            {entry.type}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {new Date(entry.time as number * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <div className="bg-gray-800 text-[10px] text-gray-300 px-1 rounded">
                                        Score: {entry.score}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-300 font-medium truncate w-24" title={entry.setupName}>{entry.setupName || 'Standard Setup'}</span>
                                    {entry.setupGrade && <span className={`text-[10px] font-bold px-1 rounded ${entry.setupGrade.includes('A') ? 'text-yellow-400' : 'text-gray-500'}`}>{entry.setupGrade}</span>}
                                </div>
                            </div>
                        ))}
                        {entries.length === 0 && <div className="text-center text-gray-600 text-xs py-4">No setups detected in current range</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
