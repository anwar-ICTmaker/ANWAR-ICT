
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
        <div className="w-full h-full bg-[#0b0e11] overflow-y-auto custom-scrollbar flex flex-col">
            <div className="max-w-7xl mx-auto w-full p-6 md:p-8 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-[#2a2e39] gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Trade History Journal</h1>
                        <p className="text-gray-500 text-sm">Detailed record of all <span className="text-blue-400 font-bold">simulated executions</span>.</p>
                    </div>
                </div>
                
                {/* Summary Cards */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0">
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Win Rate</div>
                        <div className="text-2xl font-bold text-white font-mono">{backtestStats.winRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Net PnL</div>
                        <div className={`text-2xl font-bold font-mono ${backtestStats.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>${backtestStats.netPnL.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Total Trades</div>
                        <div className="text-2xl font-bold text-white font-mono">{recentHistory.length}</div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Max Drawdown</div>
                        <div className="text-2xl font-bold text-red-400 font-mono">${backtestStats.maxDrawdown.toFixed(0)}</div>
                    </div>
                 </div>

                 {/* Trade History Table - Responsive & Slideable */}
                 <div className="flex-1 min-h-0 bg-[#151924] rounded-xl border border-[#2a2e39] shadow-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-[#2a2e39] bg-[#1e222d] shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                             Execution Log
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 z-30">
                                <tr className="bg-[#1e222d] text-xs text-gray-400 uppercase border-b border-[#2a2e39] shadow-sm">
                                    {/* Sticky Actions Column */}
                                    <th className="p-4 font-bold text-center sticky left-0 bg-[#1e222d] border-r border-[#2a2e39] shadow-[4px_0_8px_rgba(0,0,0,0.2)] w-28 z-40">Actions</th>
                                    <th className="p-4 font-bold whitespace-nowrap">Date & Time</th>
                                    <th className="p-4 font-bold">Type</th>
                                    <th className="p-4 font-bold">Setup</th>
                                    <th className="p-4 font-bold font-mono">Entry Price</th>
                                    <th className="p-4 font-bold font-mono">Stop Loss</th>
                                    <th className="p-4 font-bold font-mono">Take Profit</th>
                                    <th className="p-4 font-bold text-center">Result</th>
                                    <th className="p-4 font-bold font-mono text-right">PnL</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-[#2a2e39]">
                                {recentHistory.slice().reverse().map((entry, i) => {
                                    const isFocused = focusedEntry && entry.time === focusedEntry.time;
                                    const isWin = entry.backtestResult === 'WIN';
                                    const isLoss = entry.backtestResult === 'LOSS';
                                    const pnlColor = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400';
                                    
                                    return (
                                        <tr 
                                            key={i} 
                                            className={`hover:bg-[#1f2937] transition-colors cursor-pointer group ${isFocused ? 'bg-blue-900/10' : 'bg-[#151924]'}`}
                                            onClick={() => setClickedEntry(entry)}
                                        >
                                            {/* Sticky Actions Cell */}
                                            <td className="p-3 sticky left-0 bg-[#151924] group-hover:bg-[#1f2937] border-r border-[#2a2e39] shadow-[4px_0_8px_rgba(0,0,0,0.2)] z-20">
                                                <div className="flex items-center justify-center gap-3">
                                                    {onReplay && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onReplay(entry); }}
                                                            className="p-1.5 rounded bg-gray-700 text-gray-300 hover:text-blue-400 hover:bg-gray-600 border border-gray-600 transition-all shadow-sm"
                                                            title="Replay this Trade"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                        </button>
                                                    )}
                                                    {onFocusEntry && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onFocusEntry(entry); }} 
                                                            className={`p-1.5 rounded transition-all border shadow-sm ${isFocused ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600 border-gray-600'}`} 
                                                            title={isFocused ? "Currently Viewing" : "View on Chart"}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4 text-gray-300 font-mono text-xs whitespace-nowrap">
                                                <div className="font-bold">{new Date((entry.time as number) * 1000).toLocaleDateString()}</div>
                                                <div className="text-gray-500">{new Date((entry.time as number) * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${entry.type === 'LONG' ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>
                                                    {entry.type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-white text-xs font-medium">{entry.setupName || 'Standard Entry'}</div>
                                                <div className="text-[10px] text-gray-500">Grade: {entry.setupGrade || 'N/A'}</div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-white opacity-90">{entry.price.toFixed(2)}</td>
                                            <td className="p-4 font-mono text-xs text-gray-400">{entry.sl.toFixed(2)}</td>
                                            <td className="p-4 font-mono text-xs text-gray-400">{entry.tp.toFixed(2)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`font-bold text-xs px-2 py-1 rounded ${isWin ? 'bg-green-500/10 text-green-500' : isLoss ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                    {entry.backtestResult}
                                                </span>
                                            </td>
                                            <td className={`p-4 font-mono font-bold text-right text-base ${pnlColor}`}>
                                                {entry.backtestPnL && entry.backtestPnL > 0 ? '+' : ''}{entry.backtestPnL?.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {recentHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="p-12 text-center text-gray-500">
                                            <div className="text-lg mb-2">No trade history available yet.</div>
                                            <div className="text-sm">Run a simulation or manual backtest to populate this log.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        </div>
    );
};
