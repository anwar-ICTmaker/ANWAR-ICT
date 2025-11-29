import { ISeriesApi, ITimeScaleApi, Time } from "lightweight-charts";
import { CandleData, EntrySignal, FVG, OrderBlock, OverlayState, ColorTheme, UTCTimestamp } from "../types";
import { drawSetups } from "./drawSetups";

export const drawCanvasLayer = (
    ctx: CanvasRenderingContext2D,
    timeScale: ITimeScaleApi<Time>,
    series: ISeriesApi<"Candlestick">,
    data: CandleData[],
    obs: OrderBlock[],
    fvgs: FVG[],
    entries: EntrySignal[],
    overlays: OverlayState,
    colors: ColorTheme,
    pdRange: { high: number, low: number } | null,
    width: number,
    height: number,
    htfObs: OrderBlock[] = [],
    htfFvgs: FVG[] = []
) => {
    // Clear Canvas
    ctx.clearRect(0, 0, width, height);
    
    // --- 1. PD ZONES ---
    if (overlays.pdZones && pdRange) {
        const yH = series.priceToCoordinate(pdRange.high);
        const yL = series.priceToCoordinate(pdRange.low);
        const yM = series.priceToCoordinate((pdRange.high + pdRange.low) / 2);
        
        if (yH !== null && yL !== null && yM !== null) {
            ctx.fillStyle = 'rgba(239, 83, 80, 0.03)'; 
            ctx.fillRect(0, yH, width, yM - yH);
            
            ctx.fillStyle = 'rgba(38, 166, 154, 0.03)'; 
            ctx.fillRect(0, yM, width, yL - yM);
            
            ctx.strokeStyle = '#78909C'; 
            ctx.setLineDash([4,4]);
            ctx.lineWidth = 1;
            ctx.beginPath(); 
            ctx.moveTo(0, yM); 
            ctx.lineTo(width, yM); 
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // --- 2. ORDER BLOCKS ---
    if (overlays.obs) {
        [...obs, ...(overlays.mtf ? htfObs : [])].forEach((ob) => {
            if (ob.mitigated) return;
            // @ts-ignore
            const x1 = timeScale.timeToCoordinate(ob.time);
            const y1 = series.priceToCoordinate(ob.priceHigh);
            const y2 = series.priceToCoordinate(ob.priceLow);
            
            if (y1 === null || y2 === null) return;
            
            const startX = x1 !== null ? x1 : 0;
            const w = width - startX;
            
            const color = ob.direction === 'Bullish' ? colors.obBull : colors.obBear;
            
            // Gradient Fill
            const grad = ctx.createLinearGradient(startX, 0, startX + 200, 0);
            grad.addColorStop(0, color + '60'); // More opaque at start
            grad.addColorStop(1, color + '10'); // Fade out
            
            ctx.fillStyle = grad;
            ctx.strokeStyle = color;
            ctx.setLineDash(ob.subtype === 'Breaker' ? [4, 2] : []);
            ctx.lineWidth = ob.timeframe ? 2 : 1; 
            
            ctx.fillRect(startX, y1, w, y2 - y1);
            
            // Draw border lines
            ctx.beginPath();
            ctx.moveTo(startX, y1);
            ctx.lineTo(startX + w, y1);
            ctx.moveTo(startX, y2);
            ctx.lineTo(startX + w, y2);
            ctx.stroke();
            
            // Label
            if (x1 !== null && x1 < width - 50) {
                 ctx.fillStyle = color;
                 ctx.font = '10px Inter';
                 ctx.textAlign = 'left';
                 ctx.fillText(`${ob.timeframe || ''} ${ob.direction === 'Bullish' ? '+OB' : '-OB'}`, startX + 5, y1 - 5);
            }
        });
    }

    // --- 3. FAIR VALUE GAPS ---
    if (overlays.fvgs) {
        [...fvgs, ...(overlays.mtf ? htfFvgs : [])].forEach((fvg) => {
            // @ts-ignore
            const x1 = timeScale.timeToCoordinate(fvg.time);
            const y1 = series.priceToCoordinate(fvg.priceHigh);
            const y2 = series.priceToCoordinate(fvg.priceLow);
            
            if (y1 === null || y2 === null) return;
            const startX = x1 !== null ? x1 : 0;
            const w = width - startX;
            
            const color = fvg.direction === 'Bullish' ? colors.fvgBull : colors.fvgBear;
            ctx.fillStyle = color + '20';
            ctx.fillRect(startX, y1, w, y2 - y1);
        });
    }

    // --- 4. TRADE SETUPS (ENTRY/SL/TP BOXES) ---
    // Always draw if historicalTradeLines is true.
    // The "entries" array passed here is already filtered by the visibility logic in Chart.tsx
    // (It will contain only the focused entry if in FOCUS mode, or all entries if ALL mode)
    if (overlays.historicalTradeLines && entries.length > 0) {
        drawSetups(ctx, timeScale, series, data, entries, true, width);
    }
};