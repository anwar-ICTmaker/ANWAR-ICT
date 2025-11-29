
import { CandleData, UTCTimestamp } from "../types";

export const getHtf = (tf: string) => {
    if (['1m','3m'].includes(tf)) return '15m'; // Scalping context
    if (['5m'].includes(tf)) return '1h';
    if (['15m','30m'].includes(tf)) return '4h';
    if (['1h','4h'].includes(tf)) return '1d';
    return '1d';
};

export const fetchCandles = async (asset: string, timeframe: string, limit: number = 1000): Promise<CandleData[]> => {
    let symbol = asset;
    if (asset === 'XAUUSD.P' || asset === 'GOLD' || asset.includes('MGC')) symbol = 'PAXGUSDT'; 

    const res = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`);
    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error("Invalid API Data");
    
    return raw.map((c: any) => ({ 
        time: c[0] / 1000 as UTCTimestamp, 
        open: parseFloat(c[1]), 
        high: parseFloat(c[2]), 
        low: parseFloat(c[3]), 
        close: parseFloat(c[4]) 
    }));
};
