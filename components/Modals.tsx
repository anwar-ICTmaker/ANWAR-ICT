import React, { useMemo, Component, ReactNode } from 'react';
import { EntrySignal } from '../types';

export const EntryDetailModal = ({ entry, onClose }: { entry: EntrySignal, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center pointer-events-auto p-4" onClick={onClose}>
        <div className="bg-[#1e222d] border border-blue-500 p-6 rounded shadow-2xl max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-lg p-2">✕</button>
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className={`text-2xl font-bold ${entry.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {entry.type} SETUP
                </h3>
                <div className="text-right">
                    <div className="text-xs text-gray-500">DATE</div>
                    <div className="text-white text-sm font-mono">{new Date((entry.time as number) * 1000).toLocaleString()}</div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/20 p-3 rounded">
                    <div className="text-xs text-gray-500 mb-1">ENTRY PRICE</div>
                    <div className="text-xl font-mono">{entry.price.toFixed(2)}</div>
                </div>
                <div className="bg-black/20 p-3 rounded">
                    <div className="text-xs text-gray-500 mb-1">RESULT (2R)</div>
                    <div className={`text-xl font-bold ${entry.backtestResult === 'WIN' ? 'text-green-500' : entry.backtestResult === 'LOSS' ? 'text-red-500' : 'text-yellow-500'}`}>
                        {entry.backtestResult || 'PENDING'}
                    </div>
                </div>
            </div>
            <div className="mb-4">
                <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Confluence & Strategy</div>
                <ul className="space-y-2">
                    {entry.confluences.map((c, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-green-500">✓</span> {c}
                        </li>
                    ))}
                    <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-blue-500">ℹ</span> Style: {entry.tradingStyle}</li>
                    <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-purple-500">ℹ</span> PO3 Phase: {entry.po3Phase}</li>
                </ul>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <div className="flex justify-between text-sm font-mono mb-1"><span className="text-green-500">Target (TP):</span><span>{entry.tp.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-mono mb-1"><span className="text-red-500">Stop (SL):</span><span>{entry.sl.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-mono pt-2 border-t border-gray-700">
                    <span className="text-yellow-500">Lot Size (Risk 1%):</span>
                    <span>{entry.lotSize?.toFixed(3)}</span>
                </div>
                <div className="mt-2 text-center text-xs text-gray-500">PnL if taken: <span className={entry.backtestPnL && entry.backtestPnL > 0 ? 'text-green-400' : 'text-red-400'}>${entry.backtestPnL?.toFixed(2)}</span></div>
            </div>
            <div className="mt-4 text-center"><button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded w-full font-bold transition-colors">ACKNOWLEDGE</button></div>
        </div>
    </div>
);

export const TopSetupsModal = ({ entries, onClose }: { entries: EntrySignal[], onClose: () => void }) => {
    const topSetups = useMemo(() => {
        return [...entries].sort((a, b) => b.score - a.score).slice(0, 3);
    }, [entries]);

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1e222d] border border-yellow-500 rounded-lg max-w-2xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
                <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">⚡ TOP 3 HIGH PROBABILITY SETUPS</h2>
                <div className="space-y-4">
                    {topSetups.map((setup, i) => (
                        <div key={i} className="bg-gray-800/50 border border-gray-700 p-4 rounded hover:bg-gray-800 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-lg font-bold ${setup.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>{setup.type}</span>
                                        <span className="text-xs text-gray-500 font-mono">{new Date((setup.time as number) * 1000).toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm text-gray-300">Price: <span className="font-mono text-white">{setup.price}</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/50 inline-block mb-1">SCORE: {setup.score}/10</div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                                <strong>Confluences:</strong> {setup.confluences.join(', ')}
                            </div>
                        </div>
                    ))}
                    {topSetups.length === 0 && <div className="text-center text-gray-500 py-4">No setups found yet.</div>}
                </div>
            </div>
        </div>
    );
};

export const ToastNotification = ({ message, type, onClose }: { message: string, type: 'success'|'error'|'info'|'warning', onClose: () => void }) => (
    <div className={`fixed top-4 right-4 p-4 rounded shadow-lg z-[60] text-white animate-bounce cursor-pointer border ${type === 'success' ? 'bg-green-600 border-green-400' : type === 'warning' ? 'bg-yellow-600 border-yellow-400' : 'bg-blue-600 border-blue-400'}`} onClick={onClose}>
        <div className="flex justify-between items-center gap-4"><span>{message}</span><button onClick={onClose} className="text-sm font-bold">x</button></div>
    </div>
);

interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }
    
    componentDidCatch(error: any, errorInfo: any) {
        console.error("Chart Error:", error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) return <div className="flex items-center justify-center h-full text-red-500 bg-gray-900 p-4">Chart Error (See Console)</div>;
        return this.props.children;
    }
}
