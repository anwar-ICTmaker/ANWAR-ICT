
import React from 'react';
import { TradeEntry } from '../../types';

interface TradingPanelProps {
    balance: number;
    position: TradeEntry | null;
    data: any[];
    closeTrade: (pnl: number) => void;
    enterTrade: (type: 'LONG' | 'SHORT', price: number, sl: number, tp: number) => void;
    slInput: string; setSlInput: (s: string) => void;
    tpInput: string; setTpInput: (s: string) => void;
    autoTrade: boolean; setAutoTrade: (b: boolean) => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = (props) => {
    const currentPrice = props.data.length > 0 ? props.data[props.data.length - 1].close : 0;

    return (
        <div className="h-full flex flex-col bg-[#151924]">
            <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center shrink-0">
                <h2 className="font-bold text-white">Order Entry</h2>
                <div className="text-xs bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50">Paper Account</div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
                <div className="bg-[#0b0e11] p-4 rounded border border-[#2a2e39] mb-6">
                     <div className="text-xs text-gray-500 uppercase mb-1">Available Balance</div>
                     <div className="text-2xl font-mono text-white font-bold">${props.balance.toLocaleString()}</div>
                </div>

                {props.position ? (
                    <div className="bg-blue-900/10 p-4 rounded border border-blue-500/50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-lg text-white">{props.position.type}</span>
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">OPEN</span>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between"><span className="text-gray-400">Entry</span><span className="font-mono">{props.position.price.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Current</span><span className="font-mono text-white">{currentPrice.toFixed(2)}</span></div>
                            <div className="h-px bg-gray-700 my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">PnL</span>
                                <span className={`font-mono text-lg font-bold ${props.position.type === 'LONG' ? (currentPrice > props.position.price ? 'text-green-500' : 'text-red-500') : (props.position.price > currentPrice ? 'text-green-500' : 'text-red-500')}`}>
                                    ${(props.position.type === 'LONG' ? (currentPrice - props.position.price) : (props.position.price - currentPrice)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => props.closeTrade(0)} className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold shadow-lg transition-colors">CLOSE POSITION</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Stop Loss</label>
                                <input type="number" placeholder="Price" value={props.slInput} onChange={e => props.setSlInput(e.target.value)} className="w-full bg-[#0b0e11] text-white p-2.5 rounded border border-[#2a2e39] focus:border-blue-500 outline-none text-sm font-mono" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Take Profit</label>
                                <input type="number" placeholder="Price" value={props.tpInput} onChange={e => props.setTpInput(e.target.value)} className="w-full bg-[#0b0e11] text-white p-2.5 rounded border border-[#2a2e39] focus:border-blue-500 outline-none text-sm font-mono" />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button onClick={() => props.enterTrade('LONG', currentPrice, parseFloat(props.slInput) || currentPrice*0.99, parseFloat(props.tpInput))} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold mb-3 shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2">
                                <span>BUY / LONG</span>
                                <span className="font-mono text-xs opacity-70">@ {currentPrice.toFixed(2)}</span>
                            </button>
                            <button onClick={() => props.enterTrade('SHORT', currentPrice, parseFloat(props.slInput) || currentPrice*1.01, parseFloat(props.tpInput))} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2">
                                <span>SELL / SHORT</span>
                                <span className="font-mono text-xs opacity-70">@ {currentPrice.toFixed(2)}</span>
                            </button>
                        </div>
                        
                        <div className="mt-4 bg-[#0b0e11] p-3 rounded border border-[#2a2e39] flex items-center gap-3">
                            <input type="checkbox" checked={props.autoTrade} onChange={e => props.setAutoTrade(e.target.checked)} className="accent-blue-500 w-4 h-4"/>
                            <div className="text-xs">
                                <div className="text-white font-bold">Auto-Trading Bot</div>
                                <div className="text-gray-500">Automatically take A+ setups</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
