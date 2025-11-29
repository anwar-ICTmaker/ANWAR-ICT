
import { UTCTimestamp } from 'lightweight-charts';

export { UTCTimestamp };

export type SessionType = 'ASIA' | 'LONDON' | 'NEW_YORK' | 'NONE';

export interface CandleData {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    color?: string;
    borderColor?: string;
    wickColor?: string;
}

export interface StructurePoint {
    time: UTCTimestamp;
    price: number;
    type: 'PH' | 'PL' | 'BOS' | 'CHoCH' | 'HH' | 'HL' | 'LH' | 'LL';
    direction: 'Bullish' | 'Bearish';
}

export interface FVG {
    id: string;
    time: UTCTimestamp;
    priceHigh: number;
    priceLow: number;
    direction: 'Bullish' | 'Bearish';
    mitigated: boolean;
    isSilverBullet: boolean;
    timeframe?: string;
}

export interface OrderBlock {
    id: string;
    time: UTCTimestamp;
    priceHigh: number;
    priceLow: number;
    direction: 'Bullish' | 'Bearish';
    mitigated: boolean;
    subtype: 'Standard' | 'Breaker' | 'Swing';
    timeframe?: string;
}

export interface TradeEntry {
    time: UTCTimestamp;
    type: 'LONG' | 'SHORT';
    price: number;
    stopLoss: number;
    takeProfit: number;
    result?: 'WIN' | 'LOSS' | 'OPEN';
    pnl?: number;
    confluences: string[];
    score: number;
}

export interface EntrySignal {
    time: UTCTimestamp;
    type: 'LONG' | 'SHORT';
    price: number;
    score: number;
    confluences: string[];
    sl: number;
    tp: number;
    winProbability: number;
    tradingStyle: 'SCALP' | 'DAY_TRADE';
    po3Phase: 'ACCUMULATION' | 'MANIPULATION' | 'DISTRIBUTION' | 'NONE';
    backtestResult?: 'WIN' | 'LOSS' | 'PENDING';
    backtestPnL?: number;
    lotSize?: number;
    exitTime?: UTCTimestamp;
    setupName?: string;
    setupGrade?: string;
    confluenceLevel?: number; // The exact price level (OB/FVG) that triggered the entry
    timeframe?: string;       // The timeframe this setup was detected on
}

export interface BacktestStats {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    netPnL: number;
    profitFactor: number;
    maxDrawdown: number;
    equityCurve: number[];
}

export interface AppConfig {
    swingLength: number;
    obThreshold: number;
    fvgExtend: number;
}

export interface OverlayState {
    obs: boolean;
    fvgs: boolean;
    killzones: boolean;
    silverBullet: boolean;
    pdZones: boolean;
    internalStructure: boolean;
    swingStructure: boolean;
    mtf: boolean;
    backtestMarkers: boolean;
    macro: boolean;
    historicalTradeLines: boolean;
}

export interface ColorTheme {
    obBull: string;
    obBear: string;
    fvgBull: string;
    fvgBear: string;
}

export interface SimulationConfig {
    minWinProbability: number;
    allowedGrades: Record<string, boolean>;
}
