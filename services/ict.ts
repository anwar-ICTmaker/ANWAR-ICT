
import { CandleData, EntrySignal, FVG, OrderBlock, SessionType, StructurePoint } from '../types';

// --- UTILS ---
export const getSession = (hour: number): SessionType => {
    if (hour >= 0 && hour < 8) return 'ASIA';
    if (hour >= 7 && hour < 16) return 'LONDON';
    if (hour >= 12 && hour < 21) return 'NEW_YORK';
    return 'NONE';
};

export const determinePO3 = (candle: CandleData, session: SessionType): 'ACCUMULATION' | 'MANIPULATION' | 'DISTRIBUTION' | 'NONE' => {
    if (session === 'ASIA') return 'ACCUMULATION';
    if (session === 'LONDON' || session === 'NEW_YORK') {
        const body = Math.abs(candle.close - candle.open);
        const range = candle.high - candle.low;
        if (body > range * 0.6) return 'DISTRIBUTION';
        return 'MANIPULATION';
    }
    return 'NONE';
};

// --- ALGORITHMS ---

export const detectStructure = (data: CandleData[], swingLength: number = 5): StructurePoint[] => {
    const points: StructurePoint[] = [];
    const pivotHighs: {index: number, price: number}[] = [];
    const pivotLows: {index: number, price: number}[] = [];

    for (let i = swingLength; i < data.length - swingLength; i++) {
        let isHigh = true;
        let isLow = true;
        for (let j = 1; j <= swingLength; j++) {
            if (data[i].high <= data[i-j].high || data[i].high <= data[i+j].high) isHigh = false;
            if (data[i].low >= data[i-j].low || data[i].low >= data[i+j].low) isLow = false;
        }

        if (isHigh) pivotHighs.push({ index: i, price: data[i].high });
        if (isLow) pivotLows.push({ index: i, price: data[i].low });
    }

    let lastHigh = pivotHighs[0];
    let lastLow = pivotLows[0];

    const allPivots = [
        ...pivotHighs.map(p => ({...p, type: 'High'})), 
        ...pivotLows.map(p => ({...p, type: 'Low'}))
    ].sort((a,b) => a.index - b.index);

    for (const p of allPivots) {
        const candle = data[p.index];
        if (p.type === 'High') {
            if (!lastHigh) { lastHigh = p; continue; }
            if (p.price > lastHigh.price) {
                points.push({ time: candle.time, price: p.price, type: 'HH', direction: 'Bearish' });
            } else {
                points.push({ time: candle.time, price: p.price, type: 'LH', direction: 'Bearish' });
            }
            lastHigh = p;
        } else {
            if (!lastLow) { lastLow = p; continue; }
            if (p.price < lastLow.price) {
                 points.push({ time: candle.time, price: p.price, type: 'LL', direction: 'Bullish' });
            } else {
                 points.push({ time: candle.time, price: p.price, type: 'HL', direction: 'Bullish' });
            }
            lastLow = p;
        }
    }
    return points;
};

export const detectFVG = (data: CandleData[]): FVG[] => {
    const fvgs: FVG[] = [];
    for (let i = 2; i < data.length; i++) {
        const c1 = data[i - 2];
        const c2 = data[i - 1];
        const c3 = data[i];
        const hour = new Date((c2.time as number) * 1000).getUTCHours();
        const isSilverBullet = (hour === 14 || hour === 9 || hour === 3);

        if (c1.high < c3.low) {
            fvgs.push({ id: `fvg-bull-${c2.time}`, time: c2.time, priceHigh: c3.low, priceLow: c1.high, direction: 'Bullish', mitigated: false, isSilverBullet });
        }
        if (c1.low > c3.high) {
            fvgs.push({ id: `fvg-bear-${c2.time}`, time: c2.time, priceHigh: c1.low, priceLow: c3.high, direction: 'Bearish', mitigated: false, isSilverBullet });
        }
    }
    
    for (let i = 0; i < fvgs.length; i++) {
        const fvg = fvgs[i];
        const futureCandles = data.filter(d => (d.time as number) > (fvg.time as number));
        for (const candle of futureCandles) {
            if (fvg.direction === 'Bullish' && candle.low < fvg.priceLow) { fvg.mitigated = true; break; }
            if (fvg.direction === 'Bearish' && candle.high > fvg.priceHigh) { fvg.mitigated = true; break; }
        }
    }
    return fvgs.filter(f => !f.mitigated);
};

export const detectOrderBlocks = (data: CandleData[], thresholdMult: number): OrderBlock[] => {
    const obs: OrderBlock[] = [];
    const bodySizes = data.slice(-100).map(d => Math.abs(d.close - d.open));
    const meanBody = bodySizes.reduce((a, b) => a + b, 0) / bodySizes.length || 1;
    const IMPULSE_THRESHOLD = meanBody * thresholdMult; 

    for (let i = 2; i < data.length - 3; i++) {
        const candle = data[i];
        const nextCandle = data[i+1];
        const moveUp = (nextCandle.close - nextCandle.open) > IMPULSE_THRESHOLD;
        const moveDown = (nextCandle.open - nextCandle.close) > IMPULSE_THRESHOLD;

        if (candle.close < candle.open && moveUp && nextCandle.close > candle.high) {
            obs.push({ id: `ob-bull-${candle.time}`, time: candle.time, priceHigh: candle.high, priceLow: candle.low, direction: 'Bullish', mitigated: false, subtype: 'Standard' });
        }
        if (candle.close > candle.open && moveDown && nextCandle.close < candle.low) {
            obs.push({ id: `ob-bear-${candle.time}`, time: candle.time, priceHigh: candle.high, priceLow: candle.low, direction: 'Bearish', mitigated: false, subtype: 'Standard' });
        }
    }

    for (let i = 0; i < obs.length; i++) {
        const ob = obs[i];
        const startIndex = data.findIndex(d => d.time === ob.time);
        if (startIndex === -1) continue;
        for (let k = startIndex + 1; k < data.length; k++) {
            const current = data[k];
            if (ob.subtype === 'Standard') {
                if (ob.direction === 'Bullish' && current.close < ob.priceLow) { ob.subtype = 'Breaker'; ob.direction = 'Bearish'; } 
                else if (ob.direction === 'Bearish' && current.close > ob.priceHigh) { ob.subtype = 'Breaker'; ob.direction = 'Bullish'; }
            } else if (ob.subtype === 'Breaker') {
                if (ob.direction === 'Bullish' && current.close < ob.priceLow) ob.mitigated = true;
                else if (ob.direction === 'Bearish' && current.close > ob.priceHigh) ob.mitigated = true;
            }
        }
    }
    return obs.filter(o => !o.mitigated).slice(-10);
};

export const detectEntries = (data: CandleData[], obs: OrderBlock[], fvgs: FVG[], timeframe: string): EntrySignal[] => {
    const signals: EntrySignal[] = [];
    let lastSignalTime = 0;
    const COOLDOWN = 10 * 60; 
    const isScalping = ['1m', '3m', '5m'].includes(timeframe);

    for (let i = 100; i < data.length; i++) {
        const candle = data[i];
        const prev50 = data.slice(i-50, i);
        const avg = prev50.reduce((a,b) => a + b.close, 0) / 50;
        const isBullish = candle.close > avg;
        
        let score = 0;
        const confluences: string[] = [];

        const touchingBullOB = obs.find(ob => ob.direction === 'Bullish' && !ob.mitigated && candle.low <= ob.priceHigh && candle.low >= ob.priceLow && (ob.time as number) < (candle.time as number));
        if (touchingBullOB) { score += 3; confluences.push(`Retest Bullish ${touchingBullOB.subtype === 'Breaker' ? 'Breaker' : 'OB'}`); }
        
        const touchingBearOB = obs.find(ob => ob.direction === 'Bearish' && !ob.mitigated && candle.high >= ob.priceLow && candle.high <= ob.priceHigh && (ob.time as number) < (candle.time as number));
        if (touchingBearOB) { score += 3; confluences.push(`Retest Bearish ${touchingBearOB.subtype === 'Breaker' ? 'Breaker' : 'OB'}`); }
        
        const touchingBullFVG = fvgs.find(f => f.direction === 'Bullish' && candle.low <= f.priceHigh && candle.low >= f.priceLow && (f.time as number) < (candle.time as number));
        if (touchingBullFVG) { score += 2; confluences.push('Discount FVG'); if (touchingBullFVG.isSilverBullet) { score += 4; confluences.push('Silver Bullet Zone'); } }
        
        const touchingBearFVG = fvgs.find(f => f.direction === 'Bearish' && candle.high >= f.priceLow && candle.high <= f.priceHigh && (f.time as number) < (candle.time as number));
        if (touchingBearFVG) { score += 2; confluences.push('Premium FVG'); if (touchingBearFVG.isSilverBullet) { score += 4; confluences.push('Silver Bullet Zone'); } }
        
        const hour = new Date((candle.time as number) * 1000).getUTCHours();
        const session = getSession(hour);
        if (session !== 'NONE') score += 1;
        const po3 = determinePO3(candle, session);

        if (score >= 4 && ((candle.time as number) - lastSignalTime > COOLDOWN)) {
            const setupGrade = score >= 8 ? 'A++' : score >= 6 ? 'A+' : 'B';
            const setupName = confluences.length > 0 ? confluences[0] : 'Standard Entry';

            if (isBullish && (touchingBullOB || touchingBullFVG)) {
                 const swingLow = Math.min(...data.slice(i-5, i+1).map(c => c.low));
                 const sl = Math.min(swingLow, touchingBullOB?.priceLow || swingLow) - (candle.close * 0.0005);
                 const risk = candle.close - sl;
                 const tp = candle.close + (risk * 2); 
                 signals.push({
                    time: candle.time, type: 'LONG', price: candle.close, score, confluences, sl, tp,
                    winProbability: Math.min(95, score * 10 + 30),
                    tradingStyle: isScalping ? 'SCALP' : 'DAY_TRADE',
                    po3Phase: po3,
                    setupName,
                    setupGrade
                 });
                 lastSignalTime = candle.time as number;
            } else if (!isBullish && (touchingBearOB || touchingBearFVG)) {
                 const swingHigh = Math.max(...data.slice(i-5, i+1).map(c => c.high));
                 const sl = Math.max(swingHigh, touchingBearOB?.priceHigh || swingHigh) + (candle.close * 0.0005);
                 const risk = sl - candle.close;
                 const tp = candle.close - (risk * 2);
                 signals.push({
                    time: candle.time, type: 'SHORT', price: candle.close, score, confluences, sl, tp,
                    winProbability: Math.min(95, score * 10 + 30),
                    tradingStyle: isScalping ? 'SCALP' : 'DAY_TRADE',
                    po3Phase: po3,
                    setupName,
                    setupGrade
                 });
                 lastSignalTime = candle.time as number;
            }
        }
    }
    return signals;
};