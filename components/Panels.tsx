
import React from 'react';
import { AppConfig, BacktestStats, ColorTheme, EntrySignal, OrderBlock, OverlayState, StructurePoint, TradeEntry, SimulationConfig } from '../types';
import { ScannerPanel } from './panels/ScannerPanel';
import { TradingPanel } from './panels/TradingPanel';
import { DashboardPanel } from './panels/DashboardPanel';
import { StatsPanel } from './panels/StatsPanel';
import { SetupsPanel } from './panels/SetupsPanel';
import { SettingsPanel } from './panels/SettingsPanel';

interface PanelProps {
    activeTab: string;
    setActiveTab: (t: string) => void;
    structure: StructurePoint[];
    entries: EntrySignal[];
    setClickedEntry: (e: EntrySignal) => void;
    balance: number;
    position: TradeEntry | null;
    data: any[];
    closeTrade: (pnl: number) => void;
    enterTrade: (type: 'LONG' | 'SHORT', price: number, sl: number, tp: number) => void;
    slInput: string; setSlInput: (s: string) => void;
    tpInput: string; setTpInput: (s: string) => void;
    autoTrade: boolean; setAutoTrade: (b: boolean) => void;
    settingsTab: string; setSettingsTab: (t: string) => void;
    config: AppConfig; setConfig: (c: AppConfig) => void;
    overlays: OverlayState; setOverlays: (o: OverlayState) => void;
    colors: ColorTheme; setColors: (c: ColorTheme) => void;
    backtestStats: BacktestStats | null;
    recentHistory: EntrySignal[];
    obs: OrderBlock[];
    simulation: SimulationConfig;
    setSimulation: React.Dispatch<React.SetStateAction<SimulationConfig>>;
    onDeepScan: () => void;
    isScanning: boolean;
}

export const Panels: React.FC<PanelProps> = (props) => {
    // If on chart or empty, show nothing in the panel container
    if (props.activeTab === 'CHART' || !props.activeTab) return <div className="p-8 text-center text-gray-600 text-sm">Select a tool from the menu</div>;

    const commonProps = { onClose: () => props.setActiveTab('CHART') };

    switch (props.activeTab) {
        case 'SCANNER':
            return <ScannerPanel 
                structure={props.structure} 
                entries={props.entries} 
                setClickedEntry={props.setClickedEntry} 
                onDeepScan={props.onDeepScan} 
                isScanning={props.isScanning} 
                {...commonProps}
            />;
        case 'TRADING':
            return <TradingPanel 
                balance={props.balance} 
                position={props.position} 
                data={props.data} 
                closeTrade={props.closeTrade} 
                enterTrade={props.enterTrade} 
                slInput={props.slInput} setSlInput={props.setSlInput} 
                tpInput={props.tpInput} setTpInput={props.setTpInput} 
                autoTrade={props.autoTrade} setAutoTrade={props.setAutoTrade} 
                {...commonProps}
            />;
        case 'DASHBOARD':
            return <DashboardPanel 
                balance={props.balance} 
                backtestStats={props.backtestStats} 
                position={props.position} 
                {...commonProps}
            />;
        case 'STATS':
            return props.backtestStats ? <StatsPanel 
                backtestStats={props.backtestStats} 
                recentHistory={props.recentHistory} 
                setClickedEntry={props.setClickedEntry} 
                {...commonProps}
            /> : <div className="p-4 text-center">Loading Stats...</div>;
        case 'SETUPS': // Merged into scanner usually, but keeping if specific view needed
            return <SetupsPanel 
                obs={props.obs} 
                data={props.data} 
                entries={props.entries} 
                setClickedEntry={props.setClickedEntry} 
                {...commonProps}
            />;
        case 'SETTINGS':
            return <SettingsPanel 
                settingsTab={props.settingsTab} setSettingsTab={props.setSettingsTab} 
                config={props.config} setConfig={props.setConfig} 
                overlays={props.overlays} setOverlays={props.setOverlays} 
                colors={props.colors} setColors={props.setColors} 
                simulation={props.simulation} setSimulation={props.setSimulation} 
                {...commonProps}
            />;
        default:
            return null;
    }
};
