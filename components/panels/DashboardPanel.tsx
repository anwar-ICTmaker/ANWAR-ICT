
import React from 'react';
import { BacktestStats, TradeEntry } from '../../types';

interface DashboardPanelProps {
    balance: number;
    backtestStats: BacktestStats | null;
    position: TradeEntry | null;
    onClose: () => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({ balance, backtestStats, position, onClose }) => {
    return (
        <div className="absolute inset-0 bg-[#131722] z-40 p-4 md:p-8 overflow-y-auto pt-16 md:pt-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h1 className="text-xl md:text-2xl font-bold text-white">Account Dashboard</h1>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1e222d] p-6 rounded border-t-4 border-blue-500 shadow-lg">
                    <div className="text-gray-500 text-sm font-bold uppercase">Total Balance</div>
                    <div className="text-3xl font-mono text-white mt-2">${balance.toFixed(2)}</div>
                    <div className="text-green-500 text-xs mt-1">Live Simulation (1% Risk)</div>
                </div>
                <div className="bg-[#1e222d] p-6 rounded border-t-4 border-green-500 shadow-lg">
                    <div className="text-gray-500 text-sm font-bold uppercase">Net PnL (30 Days)</div>
                    <div className={`text-3xl font-mono mt-2 ${backtestStats?.netPnL && backtestStats.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${backtestStats?.netPnL.toLocaleString() || '0.00'}
                    </div>
                </div>
                <div className="bg-[#1e222d] p-6 rounded border-t-4 border-purple-500 shadow-lg">
                    <div className="text-gray-500 text-sm font-bold uppercase">Win Rate</div>
                    <div className="text-3xl font-mono text-white mt-2">{backtestStats?.winRate.toFixed(1)}%</div>
                    <div className="text-gray-400 text-xs mt-1">Based on recent setups</div>
                </div>
            </div>
            <div className="mt-8 bg-[#1e222d] p-6 rounded">
                <h3 className="text-lg font-bold mb-4 text-gray-300">Account Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between border-b border-gray-700 pb-2"><span>Account Type:</span> <span className="text-white">Paper / Demo</span></div>
                    <div className="flex justify-between border-b border-gray-700 pb-2"><span>Currency:</span> <span className="text-white">USD</span></div>
                    <div className="flex justify-between border-b border-gray-700 pb-2"><span>Active Position:</span> <span className={position ? 'text-blue-400 font-bold' : 'text-gray-500'}>{position ? position.type : 'None'}</span></div>
                    <div className="flex justify-between border-b border-gray-700 pb-2"><span>Data Feed:</span> <span className="text-green-400">Connected (Binance)</span></div>
                </div>
            </div>
        </div>
    );
};
