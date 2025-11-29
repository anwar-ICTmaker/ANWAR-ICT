
import React, { useState, useEffect, useMemo } from 'react';
import { CandleData, OrderBlock, FVG, StructurePoint, EntrySignal, BacktestStats, TradeEntry, UTCTimestamp, SimulationConfig } from './types';
import { fetchCandles, getHtf } from './services/api';
import { detectStructure, detectOrderBlocks, detectFVG, detectEntries } from './services/ict';
import { performBacktest } from './services/backtest';
import { ChartComponent } from './components/Chart';
import { EntryDetailModal, TopSetupsModal, ToastNotification, ErrorBoundary } from './components/Modals';
import { Panels } from './components/Panels';
import { DashboardPanel } from './components/panels/DashboardPanel';

// Icons
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const TradeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const StatsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>;
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const BacktestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/></svg>;

const App: React.FC = () => {
    // --- STATE ---
    const [data, setData] = useState<CandleData[]>([]);
    const [obs, setObs] = useState<OrderBlock[]>([]);
    const [fvgs, setFvgs] = useState<FVG[]>([]);
    const [structure, setStructure] = useState<StructurePoint[]>([]);
    const [entries, setEntries] = useState<EntrySignal[]>([]);
    const [htfObs, setHtfObs] = useState<OrderBlock[]>([]);
    const [htfFvgs, setHtfFvgs] = useState<FVG[]>([]);
    const [pdRange, setPdRange] = useState<{high: number, low: number} | null>(null);
    const [backtestStats, setBacktestStats] = useState<BacktestStats | null>(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [settingsTab, setSettingsTab] = useState('VISIBILITY'); 
    const [asset, setAsset] = useState('MGC (COMEX)');
    const [timeframe, setTimeframe] = useState('15m');
    const [showTopSetups, setShowTopSetups] = useState(false);
    const [clickedEntry, setClickedEntry] = useState<EntrySignal | null>(null);
    const [hoveredEntry, setHoveredEntry] = useState<EntrySignal | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    // Replay State
    const [replayMode, setReplayMode] = useState({ active: false, index: 0, playing: false, speed: 500 });
    const [replayDateInput, setReplayDateInput] = useState('');

    // Visibility & Focus State
    const [setupVisibility, setSetupVisibility] = useState<'ALL'|'FOCUS'|'NONE'>('ALL');
    const [focusedEntry, setFocusedEntry] = useState<EntrySignal | null>(null);

    // Configuration
    const [overlays, setOverlays] = useState({
        obs: true, fvgs: true, killzones: true, silverBullet: true, pdZones: true,
        internalStructure: true, swingStructure: true, mtf: true, backtestMarkers: true,
        macro: true, historicalTradeLines: true
    });
    const [colors, setColors] = useState({ obBull: '#00E676', obBear: '#FF1744', fvgBull: '#00BCD4', fvgBear: '#2962FF' });
    const [config, setConfig] = useState({ swingLength: 5, obThreshold: 1.2, fvgExtend: 10 });
    const [simulation, setSimulation] = useState<SimulationConfig>({
        minWinProbability: 50,
        allowedGrades: { 'A++': true, 'A+': true, 'B': true }
    });

    // Trading State
    const [balance, setBalance] = useState(50000);
    const [position, setPosition] = useState<TradeEntry | null>(null);
    const [tradeHistory, setTradeHistory] = useState<TradeEntry[]>([]);
    const [autoTrade, setAutoTrade] = useState(false);
    const [slInput, setSlInput] = useState('');
    const [tpInput, setTpInput] = useState('');
    const [alert, setAlert] = useState<{msg: string, type: 'success'|'error'|'info'|'warning'} | null>(null);

    // --- DATA FETCHING ---
    const fetchData = async () => {
        try {
            const candles = await fetchCandles(asset, timeframe);
            const htfTf = getHtf(timeframe);
            let candlesHtf: CandleData[] = [];
            try { candlesHtf = await fetchCandles(asset, htfTf, 200); } catch (e) { console.warn("HTF Data fetch failed"); }

            setData(candles);
            
            // If in replay, ensure we update max index if needed, or if live update, we might need to handle it.
            // But for simplicity, replay pauses live updates mentally.
            if (!replayMode.active) {
                setReplayMode(prev => ({...prev, index: candles.length}));
            }

            const recentSlice = candles.slice(-100);
            setPdRange({ high: Math.max(...recentSlice.map(c => c.high)), low: Math.min(...recentSlice.map(c => c.low)) });

            const _structure = detectStructure(candles, config.swingLength);
            let _obs = ['5m', '15m', '1h'].includes(timeframe) ? detectOrderBlocks(candles, config.obThreshold) : [];
            const _fvgs = detectFVG(candles);
            const _htfObs = detectOrderBlocks(candlesHtf, config.obThreshold);
            const _htfFvgs = detectFVG(candlesHtf);
            
            const isLowTf = ['1m', '3m'].includes(timeframe);
            let obsForDetection = isLowTf ? _htfObs : _obs;
            if (isLowTf && obsForDetection.length === 0) {
                obsForDetection = detectOrderBlocks(candles, config.obThreshold);
                _obs = obsForDetection;
            }
            const fvgsForDetection = isLowTf ? _htfFvgs : _fvgs; 

            const _rawEntries = detectEntries(candles, obsForDetection, fvgsForDetection, timeframe);
            const _filteredEntries = _rawEntries.filter(e => {
                const meetsProb = e.winProbability >= simulation.minWinProbability;
                // @ts-ignore
                const meetsGrade = e.setupGrade ? simulation.allowedGrades[e.setupGrade] : false;
                return meetsProb && meetsGrade;
            });

            setHtfObs(_htfObs);
            setHtfFvgs(_htfFvgs);
            
            const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
            const recentEntries = _filteredEntries.filter(e => (e.time as number) > thirtyDaysAgo);
            
            const bt = performBacktest(candles, recentEntries);
            setBacktestStats(bt.stats);
            setEntries(bt.results);
            setStructure(_structure); setObs(_obs); setFvgs(_fvgs);

            const currentPrice = candles[candles.length - 1].close;
            const nearestOB = obsForDetection.find(ob => !ob.mitigated && Math.abs(currentPrice - ob.priceHigh) / currentPrice < 0.0005); 
            if (nearestOB && !alert && !replayMode.active) {
                setAlert({ msg: `Price near ${nearestOB.direction} Order Block!`, type: 'warning' });
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [asset, timeframe, autoTrade, config, simulation]);

    // --- REPLAY LOGIC ---
    useEffect(() => {
        let interval: any;
        if (replayMode.active && replayMode.playing) {
            interval = setInterval(() => {
                setReplayMode(prev => {
                    if (prev.index >= data.length) {
                        return { ...prev, playing: false };
                    }
                    return { ...prev, index: prev.index + 1 };
                });
            }, replayMode.speed);
        }
        return () => clearInterval(interval);
    }, [replayMode.active, replayMode.playing, replayMode.speed, data.length]);

    const handleStartReplay = (trade?: EntrySignal) => {
        if (trade) {
            const tradeIndex = data.findIndex(d => d.time === trade.time);
            if (tradeIndex === -1) return;
            // Start 50 candles before execution
            const startIndex = Math.max(0, tradeIndex - 50);
            setReplayMode({ active: true, index: startIndex, playing: false, speed: 500 });
            setFocusedEntry(trade);
            setSetupVisibility('FOCUS');
        } else {
            // Manual Start from date or random
            let startIndex = 0;
            if (replayDateInput && data.length > 0) {
                 const targetTime = new Date(replayDateInput).getTime() / 1000;
                 // Find closest candle
                 const closest = data.findIndex(d => (d.time as number) >= targetTime);
                 startIndex = closest !== -1 ? closest : 0;
            } else if (data.length > 0) {
                 // Random point in last 50% of data
                 startIndex = Math.floor(data.length / 2 + Math.random() * (data.length / 2));
            }
            setReplayMode({ active: true, index: startIndex, playing: false, speed: 500 });
            setFocusedEntry(null);
            setSetupVisibility('ALL');
        }
        setActiveTab('BACKTEST');
    };

    const handleReplayControls = {
        togglePlay: () => setReplayMode(p => ({ ...p, playing: !p.playing })),
        changeSpeed: () => setReplayMode(p => ({ ...p, speed: p.speed === 100 ? 800 : p.speed === 800 ? 500 : p.speed === 500 ? 200 : 100 })), // cycle speeds
        exit: () => {
            setReplayMode(p => ({ ...p, active: false, playing: false }));
            setSetupVisibility('ALL');
            setFocusedEntry(null);
        },
        seek: (val: number) => setReplayMode(p => ({ ...p, index: val }))
    };

    // Calculate displayed data based on replay
    const displayedData = useMemo(() => {
        if (!replayMode.active) return data;
        return data.slice(0, replayMode.index);
    }, [data, replayMode.active, replayMode.index]);

    // Filter indicators for replay to avoid look-ahead
    const displayedObs = useMemo(() => {
         if (!replayMode.active) return obs;
         const lastTime = displayedData.length > 0 ? displayedData[displayedData.length-1].time as number : 0;
         return obs.filter(o => (o.time as number) <= lastTime);
    }, [obs, replayMode.active, displayedData]);

    const displayedFvgs = useMemo(() => {
         if (!replayMode.active) return fvgs;
         const lastTime = displayedData.length > 0 ? displayedData[displayedData.length-1].time as number : 0;
         return fvgs.filter(f => (f.time as number) <= lastTime);
    }, [fvgs, replayMode.active, displayedData]);


    // --- ACTIONS ---
    const enterTrade = (type: 'LONG'|'SHORT', price: number, sl: number, tp: number) => { 
        setPosition({ time: Math.floor(Date.now() / 1000) as UTCTimestamp, type, price, stopLoss: sl, takeProfit: tp, result: 'OPEN', confluences: [], score: 0 }); 
    };
    const closeTrade = (pnl: number) => { 
        if (!position) return; 
        setBalance(prev => prev + pnl); 
        setTradeHistory(prev => [{ ...position, result: pnl > 0 ? 'WIN' : 'LOSS', pnl }, ...prev]); 
        setPosition(null); 
    };
    const handleDeepScan = () => {
        setIsScanning(true);
        setTimeout(() => { setIsScanning(false); setAlert({ msg: "Deep Scan Complete: Adjusted probabilities", type: "success" }); }, 2000);
    };

    const handleFocusEntry = (entry: EntrySignal) => {
        setFocusedEntry(entry);
        setSetupVisibility('FOCUS');
        if (activeTab === 'DASHBOARD') setActiveTab('CHART');
    };

    const thirtyDaysAgoTimestamp = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const recentHistory = entries.filter(e => e.backtestResult !== 'PENDING' && (e.time as number) > thirtyDaysAgoTimestamp);
    const isLowTf = ['1m', '3m'].includes(timeframe);
    const visibleFvgs = isLowTf ? [] : displayedFvgs;

    // --- LAYOUT LOGIC ---
    const isDashboard = activeTab === 'DASHBOARD';
    // Sidebar panels are active if tab is NOT Dashboard, NOT Chart, and NOT Backtest
    const isSidebarPanelOpen = !['DASHBOARD', 'CHART', 'BACKTEST'].includes(activeTab);

    // --- RENDER HELPERS ---
    const SideNavItem = ({ icon, label, id }: { icon: any, label: string, id: string }) => (
        <button onClick={() => setActiveTab(id)} className={`w-full p-3 flex flex-col items-center gap-1 transition-colors ${activeTab === id ? 'text-blue-500 bg-gray-800/50 border-r-2 border-blue-500' : 'text-gray-500 hover:text-white hover:bg-gray-800/30'}`}>
            {icon}
        </button>
    );

    return (
        <div className="flex flex-col h-screen bg-[#0b0e11] text-[#e1e3e6] font-sans overflow-hidden">
            {alert && <ToastNotification message={alert.msg} type={alert.type} onClose={() => setAlert(null)} />}
            {showTopSetups && <TopSetupsModal entries={entries} onClose={() => setShowTopSetups(false)} />}
            {clickedEntry && <EntryDetailModal entry={clickedEntry} onClose={() => setClickedEntry(null)} />}

            {/* TOP BAR */}
            <header className="h-14 bg-[#151924] border-b border-[#2a2e39] flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-lg tracking-tight text-white flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('DASHBOARD')}>
                        <span className="text-blue-500">ICT</span>MASTER
                    </div>
                    <div className="h-6 w-[1px] bg-gray-700 mx-2 hidden md:block"></div>
                    <select value={asset} onChange={e => setAsset(e.target.value)} className="bg-[#0b0e11] text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500">
                        {['MGC (COMEX)', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'EURUSDT'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex bg-[#0b0e11] rounded border border-gray-700 p-0.5">
                        {['1m', '5m', '15m', '1h', '4h'].map(tf => ( 
                            <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-0.5 text-xs rounded ${timeframe === tf ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{tf}</button> 
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Balance</span>
                        <span className="font-mono text-sm text-white font-bold">${balance.toLocaleString()}</span>
                    </div>
                     <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">PnL</span>
                        <span className={`font-mono text-sm font-bold ${backtestStats?.netPnL && backtestStats.netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>${backtestStats?.netPnL?.toLocaleString() || '0.00'}</span>
                    </div>
                    <button onClick={() => setShowTopSetups(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors animate-pulse">
                        TOP SETUPS
                    </button>
                </div>
            </header>

            {/* MAIN LAYOUT */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT SIDEBAR (Navigation Rail) */}
                <nav className="w-16 bg-[#151924] border-r border-[#2a2e39] hidden md:flex flex-col items-center py-4 gap-2 z-40">
                    <SideNavItem icon={<DashboardIcon/>} label="Dash" id="DASHBOARD" />
                    <SideNavItem icon={<ChartIcon/>} label="Chart" id="CHART" />
                    <SideNavItem icon={<BacktestIcon/>} label="Replay" id="BACKTEST" />
                    <SideNavItem icon={<ListIcon/>} label="Scanner" id="SCANNER" />
                    <SideNavItem icon={<TradeIcon/>} label="Trade" id="TRADING" />
                    <SideNavItem icon={<StatsIcon/>} label="Stats" id="STATS" />
                    <div className="flex-1"></div>
                    <SideNavItem icon={<SettingsIcon/>} label="Settings" id="SETTINGS" />
                </nav>

                {/* CENTER CONTENT AREA */}
                <main className="flex-1 relative bg-[#0b0e11] flex flex-col min-w-0">
                    
                    {activeTab === 'DASHBOARD' ? (
                        /* DASHBOARD VIEW */
                        <DashboardPanel 
                            balance={balance} 
                            backtestStats={backtestStats} 
                            position={position} 
                            currentAsset={asset}
                            onAssetChange={setAsset}
                        />
                    ) : activeTab === 'BACKTEST' ? (
                        /* BACKTEST / REPLAY VIEW */
                        replayMode.active ? (
                             <div className="flex-1 relative h-full">
                                <ErrorBoundary>
                                    <ChartComponent 
                                        data={displayedData} obs={displayedObs} fvgs={visibleFvgs} structure={structure} entries={entries} 
                                        overlays={overlays} colors={colors} onHoverEntry={setHoveredEntry} onClickEntry={setClickedEntry} 
                                        onToggleOverlay={() => setOverlays(p => ({...p, killzones: !p.killzones}))} 
                                        pdRange={pdRange} position={position} htfObs={htfObs} htfFvgs={htfFvgs}
                                        setOverlays={setOverlays}
                                        onReload={fetchData}
                                        setupVisibility={setupVisibility}
                                        setSetupVisibility={setSetupVisibility}
                                        focusedEntry={focusedEntry}
                                        replayState={{...replayMode, maxIndex: data.length}}
                                        onReplayControl={handleReplayControls}
                                    />
                                </ErrorBoundary>
                            </div>
                        ) : (
                            /* BACKTEST CONFIG SCREEN */
                            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0b0e11]">
                                <div className="bg-[#151924] p-8 rounded-xl border border-[#2a2e39] max-w-md w-full shadow-2xl">
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <div className="bg-blue-600 p-2 rounded-lg"><BacktestIcon /></div>
                                        Replay Simulator
                                    </h2>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm font-bold text-gray-400 mb-2 block uppercase">Select Asset</label>
                                            <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] text-white font-mono">{asset}</div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-gray-400 mb-2 block uppercase">Start Date</label>
                                            <input 
                                                type="datetime-local" 
                                                className="w-full bg-[#0b0e11] text-white p-3 rounded border border-[#2a2e39] focus:border-blue-500 outline-none"
                                                value={replayDateInput}
                                                onChange={e => setReplayDateInput(e.target.value)}
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Leave empty to start from a random point.</p>
                                        </div>

                                        <button 
                                            onClick={() => handleStartReplay()}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-bold text-lg shadow-lg transition-transform hover:scale-[1.02]"
                                        >
                                            START SESSION
                                        </button>

                                        <div className="pt-4 border-t border-[#2a2e39]">
                                             <div className="text-xs text-gray-500 text-center mb-2">OR PRACTICE SPECIFIC SETUPS</div>
                                             <div className="grid grid-cols-2 gap-2">
                                                 <button onClick={() => setAlert({msg: "Feature coming soon!", type: "info"})} className="bg-[#0b0e11] hover:bg-gray-800 text-gray-400 py-2 rounded border border-[#2a2e39] text-xs font-bold">ORDER BLOCKS</button>
                                                 <button onClick={() => setAlert({msg: "Feature coming soon!", type: "info"})} className="bg-[#0b0e11] hover:bg-gray-800 text-gray-400 py-2 rounded border border-[#2a2e39] text-xs font-bold">FVG ENTRIES</button>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        /* CHART VIEW (Live) */
                        <>
                            {/* Ticker Tape */}
                            <div className="h-6 bg-[#0b0e11] border-b border-[#2a2e39] flex items-center overflow-hidden whitespace-nowrap px-2 z-10 shrink-0">
                                <div className="text-[10px] font-bold text-gray-500 mr-2">LIVE:</div>
                                <div className="animate-marquee flex gap-8">
                                    {entries.slice(-5).reverse().map((e, i) => ( 
                                        <span key={i} className={`text-[10px] font-mono ${e.score >= 7 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {e.type} {asset} @ {e.price.toFixed(2)} [Score:{e.score}]
                                        </span> 
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex-1 relative">
                                <ErrorBoundary>
                                    <ChartComponent 
                                        data={data} obs={obs} fvgs={visibleFvgs} structure={structure} entries={entries} 
                                        overlays={overlays} colors={colors} onHoverEntry={setHoveredEntry} onClickEntry={setClickedEntry} 
                                        onToggleOverlay={() => setOverlays(p => ({...p, killzones: !p.killzones}))} 
                                        pdRange={pdRange} position={position} htfObs={htfObs} htfFvgs={htfFvgs}
                                        setOverlays={setOverlays}
                                        onReload={fetchData}
                                        setupVisibility={setupVisibility}
                                        setSetupVisibility={setSetupVisibility}
                                        focusedEntry={focusedEntry}
                                        // Replay is disabled in Live View
                                        replayState={{ active: false, index: 0, playing: false, speed: 0, maxIndex: 0 }}
                                        onReplayControl={handleReplayControls}
                                    />
                                </ErrorBoundary>
                                
                                {/* Hover Tooltip */}
                                {hoveredEntry && !clickedEntry && (
                                    <div className="absolute top-4 left-16 bg-[#151924] border border-blue-500/50 p-3 rounded shadow-xl text-xs z-50 pointer-events-none">
                                        <div className="font-bold text-white mb-1 flex items-center gap-2">
                                            <span className={hoveredEntry.type === 'LONG' ? 'text-green-500' : 'text-red-500'}>{hoveredEntry.type}</span>
                                            <span className="bg-gray-700 px-1 rounded text-[10px]">{hoveredEntry.setupGrade}</span>
                                        </div>
                                        <div className="text-gray-400 mb-1">Win Prob: <span className="text-white">{hoveredEntry.winProbability}%</span></div>
                                        <div className="text-gray-500 italic">{hoveredEntry.confluences[0]}</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>

                {/* RIGHT SIDEBAR (Tools) - Only visible when not in Dashboard/Backtest/Pure Chart mode */}
                {isSidebarPanelOpen && (
                    <aside className="hidden md:flex w-[320px] bg-[#151924] border-l border-[#2a2e39] flex-col z-30 shadow-xl">
                        <Panels 
                            activeTab={activeTab} setActiveTab={setActiveTab}
                            structure={structure} entries={entries} setClickedEntry={setClickedEntry}
                            balance={balance} position={position} data={data} closeTrade={closeTrade}
                            enterTrade={enterTrade} slInput={slInput} setSlInput={setSlInput}
                            tpInput={tpInput} setTpInput={setTpInput} autoTrade={autoTrade} setAutoTrade={setAutoTrade}
                            settingsTab={settingsTab} setSettingsTab={setSettingsTab}
                            config={config} setConfig={setConfig} overlays={overlays} setOverlays={setOverlays}
                            colors={colors} setColors={setColors} backtestStats={backtestStats}
                            recentHistory={recentHistory} obs={obs}
                            simulation={simulation} setSimulation={setSimulation}
                            onDeepScan={handleDeepScan} isScanning={isScanning}
                            onFocusEntry={handleFocusEntry}
                            focusedEntry={focusedEntry}
                            // @ts-ignore
                            onReplay={handleStartReplay}
                        />
                    </aside>
                )}
            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            <nav className="md:hidden h-16 bg-[#151924] border-t border-[#2a2e39] flex items-center justify-around shrink-0 z-50 pb-safe">
                 <button onClick={() => setActiveTab('DASHBOARD')} className={`flex flex-col items-center gap-1 ${activeTab === 'DASHBOARD' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <DashboardIcon /> <span className="text-[10px]">Home</span>
                </button>
                <button onClick={() => setActiveTab('CHART')} className={`flex flex-col items-center gap-1 ${activeTab === 'CHART' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <ChartIcon /> <span className="text-[10px]">Chart</span>
                </button>
                <button onClick={() => setActiveTab('BACKTEST')} className={`flex flex-col items-center gap-1 ${activeTab === 'BACKTEST' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <BacktestIcon /> <span className="text-[10px]">Replay</span>
                </button>
                <button onClick={() => setActiveTab('SCANNER')} className={`flex flex-col items-center gap-1 ${activeTab === 'SCANNER' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <ListIcon /> <span className="text-[10px]">Scanner</span>
                </button>
                <button onClick={() => setActiveTab('TRADING')} className={`flex flex-col items-center gap-1 ${activeTab === 'TRADING' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <TradeIcon /> <span className="text-[10px]">Trade</span>
                </button>
            </nav>

            {/* MOBILE PANEL DRAWER (Scanner/Stats/Trading overlay on mobile) */}
            <div className={`md:hidden fixed inset-0 z-50 bg-[#0b0e11] transform transition-transform duration-300 flex flex-col ${isSidebarPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                 <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#151924]">
                    <h2 className="font-bold text-lg text-white">{activeTab}</h2>
                    <button onClick={() => setActiveTab('CHART')} className="text-gray-400 p-2">✕ Close</button>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    <Panels 
                        activeTab={activeTab} setActiveTab={setActiveTab}
                        structure={structure} entries={entries} setClickedEntry={setClickedEntry}
                        balance={balance} position={position} data={data} closeTrade={closeTrade}
                        enterTrade={enterTrade} slInput={slInput} setSlInput={setSlInput}
                        tpInput={tpInput} setTpInput={setTpInput} autoTrade={autoTrade} setAutoTrade={setAutoTrade}
                        settingsTab={settingsTab} setSettingsTab={setSettingsTab}
                        config={config} setConfig={setConfig} overlays={overlays} setOverlays={setOverlays}
                        colors={colors} setColors={setColors} backtestStats={backtestStats}
                        recentHistory={recentHistory} obs={obs}
                        simulation={simulation} setSimulation={setSimulation}
                        onDeepScan={handleDeepScan} isScanning={isScanning}
                        onFocusEntry={handleFocusEntry}
                        focusedEntry={focusedEntry}
                        // @ts-ignore
                        onReplay={handleStartReplay}
                    />
                 </div>
            </div>
        </div>
    );
};

export default App;
