
import React from 'react';
import { OrderBlock, CandleData, EntrySignal } from '../../types';

interface SetupsPanelProps {
    obs: OrderBlock[];
    data: CandleData[];
    entries: EntrySignal[];
    setClickedEntry: (e: EntrySignal) => void;
    onClose: () => void;
}

export const SetupsPanel: React.FC<SetupsPanelProps> = ({ obs, data, entries, setClickedEntry, onClose }) => {
    return (
        <div className="absolute inset-0 bg-[#131722] z-40 p-4 md:p-8 overflow-y-auto pt-16 md:pt-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h1 className="text-xl md:text-2xl font-bold text-white">Signal Scanner</h1>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-bold mb-4 text-yellow-400">🚨 Proximity Alerts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {obs.filter(ob => !ob.mitigated && Math.abs(data[data.length-1].close - ob.priceHigh) / data[data.length-1].close < 0.002).map((ob, i) => (
                        <div key={i} className="bg-gray-800 p-4 rounded border-l-4 border-yellow-500 animate-pulse">
                            <div className="font-bold">Price near {ob.direction} OB</div>
                            <div className="text-sm text-gray-400">Level: {ob.priceHigh}</div>
                        </div>
                    ))}
                    {obs.filter(ob => !ob.mitigated && Math.abs(data[data.length-1].close - ob.priceHigh) / data[data.length-1].close < 0.002).length === 0 && (
                        <div className="p-4 bg-gray-800 rounded text-gray-500">No immediate setups nearby.</div>
                    )}
                </div>
                <h2 className="text-xl font-bold mb-4 text-blue-400">Valid Setups (History)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {entries.slice().reverse().map((entry, i) => (
                        <div key={i} className="bg-[#1e222d] p-4 rounded border border-gray-700 hover:border-blue-500 cursor-pointer" onClick={() => setClickedEntry(entry)}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-bold ${entry.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>{entry.type}</span>
                                <span className="text-xs text-gray-500">{new Date((entry.time as number)*1000).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-sm mb-1 text-gray-300">{entry.setupName}</div>
                            <div className="flex gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${entry.setupGrade?.includes('A') ? 'bg-green-900 text-green-300' : 'bg-gray-700'}`}>Grade {entry.setupGrade}</span>
                                <span className="text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-300">{entry.winProbability}% Prob</span>
                            </div>
                            <div className="text-2xl font-mono mb-2">{entry.price.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
