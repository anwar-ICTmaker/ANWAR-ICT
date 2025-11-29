
import React from 'react';
import { BacktestStats, EntrySignal } from '../../types';

interface StatsPanelProps {
    backtestStats: BacktestStats;
    recentHistory: EntrySignal[];
    setClickedEntry: (e: EntrySignal) => void;
    onFocusEntry?: (e: EntrySignal) => void;
    focusedEntry?: EntrySignal | null;
    onReplay?: (e: EntrySignal) => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ backtestStats, recentHistory, setClickedEntry, onFocusEntry, focusedEntry, onReplay }) => {
    return (
        <div className="h-full flex flex-col bg-[#151924]">
            <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center shrink-0">
                <h2 className="font-bold text-white">Performance</h2>
                <div className="text-xs text-gray-500">30D Analysis</div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
                 <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#0b0e11] p-3 rounded border-l-2 border-blue-500">
                        <div className="text-gray-500 text-[10px] uppercase">Win Rate</div>
                        <div className="text-xl font-bold text-white">{backtestStats.winRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-[#0b0e11] p-3 rounded border-l-2 border-green-500">
                        <div className="text-gray-500 text-[10px] uppercase">Net PnL</div>
                        <div className="text-xl font-bold text-green-400">${backtestStats.netPnL.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#0b0e11] p-3 rounded border-l-2 border-purple-500">
                        <div className="text-gray-500 text-[10px] uppercase">Trades</div>
                        <div className="text-xl font-bold text-white">{recentHistory.length}</div>
                    </div>
                    <div className="bg-[#0b0e11] p-3 rounded border-l-2 border-gray-500">
                        <div className="text-gray-500 text-[10px] uppercase">Drawdown</div>
                        <div className="text-xl font-bold text-red-400">${backtestStats.maxDrawdown.toFixed(0)}</div>
                    </div>
                 </div>

                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Trade Journal</h3>
                 <div className="space-y-2">
                    {recentHistory.slice().reverse().map((entry, i) => {
                        const isFocused = focusedEntry && entry.time === focusedEntry.time;
                        return (
                            <div key={i} className={`flex justify-between items-center p-3 bg-[#0b0e11] rounded border transition-colors ${isFocused ? 'border-blue-500 bg-blue-900/10' : 'border-[#2a2e39] hover:bg-gray-800'}`}>
                                <div className="cursor-pointer flex-1" onClick={() => setClickedEntry(entry)}>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`font-bold text-xs ${entry.backtestResult === 'WIN' ? 'text-green-500' : entry.backtestResult === 'LOSS' ? 'text-red-500' : 'text-gray-400'}`}>
                                            {entry.backtestResult}
                                        </span>
                                        <span className="text-gray-500 text-[10px]">{new Date(entry.time as number * 1000).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-300">{entry.type} @ {entry.price.toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`font-mono text-sm font-bold ${entry.backtestPnL && entry.backtestPnL > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {entry.backtestPnL && entry.backtestPnL > 0 ? '+' : ''}{entry.backtestPnL?.toFixed(0)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {onReplay && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onReplay(entry); }}
                                                className="p-1 rounded bg-gray-800 text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-all"
                                                title="Replay Trade"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                            </button>
                                        )}
                                        {onFocusEntry && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onFocusEntry(entry); }} 
                                                className={`p-1 transition-colors ${isFocused ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-white'}`}
                                                title={isFocused ? "Currently Viewing" : "View on Chart"}
                                            >
                                                {isFocused ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>
        </div>
    );
};
