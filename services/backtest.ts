
import { BacktestStats, CandleData, EntrySignal, UTCTimestamp } from "../types";

export const performBacktest = (data: CandleData[], signals: EntrySignal[]): { stats: BacktestStats, results: EntrySignal[] } => {
    let wins = 0;
    let losses = 0;
    let netPnL = 0;
    let maxDrawdown = 0;
    let peakBalance = 0;
    
    // ACCOUNT SETTINGS: $50k Start, 1% Risk
    const START_BALANCE = 50000;
    const RISK_PERCENT = 0.01; // 1% Risk
    const RR = 2;
    
    let currentBalance = START_BALANCE;
    const equityCurve: number[] = [START_BALANCE];

    const processedSignals = signals.map(signal => {
        const riskAmount = currentBalance * RISK_PERCENT;
        const distance = Math.abs(signal.price - signal.sl);
        
        // Lot Size Calculation (Approximation for Crypto/CFD logic: Risk / Distance)
        const lotSize = distance > 0 ? (riskAmount / distance) : 0;
        
        const startIndex = data.findIndex(d => d.time === signal.time);
        if (startIndex === -1) return { ...signal, lotSize };

        let result: 'WIN' | 'LOSS' | 'PENDING' = 'PENDING';
        let pnl = 0;
        let exitTime: UTCTimestamp | undefined = undefined;

        for (let i = startIndex + 1; i < data.length; i++) {
            const candle = data[i];
            if (signal.type === 'LONG') {
                if (candle.low <= signal.sl) { 
                    result = 'LOSS'; 
                    pnl = -riskAmount; 
                    exitTime = candle.time;
                    break; 
                }
                if (candle.high >= signal.tp) { 
                    result = 'WIN'; 
                    pnl = riskAmount * RR; 
                    exitTime = candle.time;
                    break; 
                }
            } else {
                if (candle.high >= signal.sl) { 
                    result = 'LOSS'; 
                    pnl = -riskAmount; 
                    exitTime = candle.time;
                    break; 
                }
                if (candle.low <= signal.tp) { 
                    result = 'WIN'; 
                    pnl = riskAmount * RR; 
                    exitTime = candle.time;
                    break; 
                }
            }
        }

        if (result === 'WIN') wins++;
        if (result === 'LOSS') losses++;
        
        netPnL += pnl;
        currentBalance += pnl;
        equityCurve.push(currentBalance);
        
        peakBalance = Math.max(peakBalance, currentBalance);
        const dd = peakBalance - currentBalance;
        maxDrawdown = Math.max(maxDrawdown, dd);

        return { ...signal, backtestResult: result, backtestPnL: pnl, lotSize, exitTime };
    });

    const totalTrades = wins + losses; 
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = losses > 0 ? (wins * (RR * 1000)) / (losses * 1000) : wins > 0 ? 999 : 0; // Simplified PF calc

    return {
        stats: { totalTrades, wins, losses, winRate, netPnL, profitFactor, maxDrawdown, equityCurve },
        results: processedSignals
    };
};
