
import React from 'react';
import { AppConfig, OverlayState, ColorTheme, SimulationConfig } from '../../types';

interface SettingsPanelProps {
    settingsTab: string;
    setSettingsTab: (t: string) => void;
    config: AppConfig;
    setConfig: (c: AppConfig) => void;
    overlays: OverlayState;
    setOverlays: (o: OverlayState) => void;
    colors: ColorTheme;
    setColors: (c: ColorTheme) => void;
    simulation: SimulationConfig;
    setSimulation: React.Dispatch<React.SetStateAction<SimulationConfig>>;
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = (props) => {
    return (
        <div className="absolute inset-0 bg-[#131722] z-40 p-4 md:p-8 overflow-y-auto pt-16 md:pt-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h1 className="text-xl md:text-2xl font-bold text-white">Settings</h1>
                <button onClick={props.onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="bg-[#1e222d] rounded p-4 md:p-6 shadow-lg max-w-3xl mx-auto">
                <div className="flex gap-4 mb-6 border-b border-gray-700 overflow-x-auto">
                     {['SIMULATION', 'INPUTS', 'STYLE', 'VISIBILITY'].map(tab => ( <button key={tab} onClick={() => props.setSettingsTab(tab)} className={`pb-2 font-bold text-sm ${props.settingsTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>{tab}</button> ))}
                </div>
                
                {props.settingsTab === 'SIMULATION' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-blue-400 text-xs font-bold uppercase mb-4">Entry Filters (Auto & Backtest)</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="font-bold text-sm">Min Win Probability</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="range" min="0" max="100" step="5" 
                                            value={props.simulation.minWinProbability} 
                                            onChange={e => props.setSimulation({...props.simulation, minWinProbability: parseInt(e.target.value)})}
                                            className="w-32 accent-blue-500"
                                        />
                                        <span className="text-blue-400 font-mono w-12 text-right">{props.simulation.minWinProbability}%</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">Only setups with a calculated probability higher than this will be taken.</p>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-6">
                            <h3 className="text-blue-400 text-xs font-bold uppercase mb-4">Grade Filtering</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {['A++', 'A+', 'B'].map(grade => (
                                    <label key={grade} className={`flex flex-col items-center p-4 rounded border cursor-pointer transition-all ${props.simulation.allowedGrades[grade as keyof typeof props.simulation.allowedGrades] ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-800 border-gray-700'}`}>
                                        <span className="font-bold text-lg mb-2">{grade}</span>
                                        <input 
                                            type="checkbox" 
                                            checked={props.simulation.allowedGrades[grade as keyof typeof props.simulation.allowedGrades]} 
                                            onChange={() => props.setSimulation({
                                                ...props.simulation, 
                                                allowedGrades: {
                                                    ...props.simulation.allowedGrades,
                                                    [grade]: !props.simulation.allowedGrades[grade as keyof typeof props.simulation.allowedGrades]
                                                }
                                            })}
                                            className="accent-blue-500 w-5 h-5"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {props.settingsTab === 'INPUTS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center"><label className="font-bold">Swing Structure Length</label><input type="number" value={props.config.swingLength} onChange={e => props.setConfig({...props.config, swingLength: parseInt(e.target.value)})} className="bg-gray-800 p-2 rounded w-20 text-center"/></div>
                        <div className="flex justify-between items-center"><label className="font-bold">Order Block Threshold</label><input type="number" step="0.1" value={props.config.obThreshold} onChange={e => props.setConfig({...props.config, obThreshold: parseFloat(e.target.value)})} className="bg-gray-800 p-2 rounded w-20 text-center"/></div>
                    </div>
                )}
                 {props.settingsTab === 'VISIBILITY' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-blue-400 text-xs font-bold uppercase mb-2">Structure & Patterns</h3>
                            {Object.entries(props.overlays).map(([key, val]) => (
                                <label key={key} className="flex items-center justify-between p-2 bg-gray-800 rounded"><span>{key.replace(/([A-Z])/g, ' $1').trim()}</span><input type="checkbox" checked={val} onChange={() => props.setOverlays({...props.overlays, [key]: !val})} /></label>
                            ))}
                        </div>
                    </div>
                )}
                
                {props.settingsTab === 'STYLE' && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-500">Bullish Order Block</label><input type="color" value={props.colors.obBull} onChange={e => props.setColors({...props.colors, obBull: e.target.value})} className="block w-full h-8 rounded cursor-pointer mt-1"/></div>
                            <div><label className="text-xs text-gray-500">Bearish Order Block</label><input type="color" value={props.colors.obBear} onChange={e => props.setColors({...props.colors, obBear: e.target.value})} className="block w-full h-8 rounded cursor-pointer mt-1"/></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-500">Bullish FVG</label><input type="color" value={props.colors.fvgBull} onChange={e => props.setColors({...props.colors, fvgBull: e.target.value})} className="block w-full h-8 rounded cursor-pointer mt-1"/></div>
                            <div><label className="text-xs text-gray-500">Bearish FVG</label><input type="color" value={props.colors.fvgBear} onChange={e => props.setColors({...props.colors, fvgBear: e.target.value})} className="block w-full h-8 rounded cursor-pointer mt-1"/></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
