
import { ISeriesApi, ITimeScaleApi, Time } from "lightweight-charts";
import { CandleData, EntrySignal, FVG, OrderBlock, OverlayState, ColorTheme, UTCTimestamp } from "../types";

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
    
    // Helper to draw text with background
    const drawLabel = (text: string, x: number, y: number, color: string, align: 'left' | 'right' | 'center' = 'left') => {
        ctx.font = 'bold 10px Inter, sans-serif';
        const metrics = ctx.measureText(text);
        const pad = 4;
        const bgW = metrics.width + pad * 2;
        const bgH = 14;
        
        let drawX = x;
        if (align === 'right') drawX = x - bgW;
        if (align === 'center') drawX = x - bgW / 2;

        ctx.fillStyle = color;
        // Rounded rect for label
        const r = 3;
        
        ctx.beginPath();
        ctx.roundRect(drawX, y - bgH/2, bgW, bgH, r);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, drawX + pad, y);
    };

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
    if (overlays.historicalTradeLines && data.length > 0) {
        const lastCandleTime = data[data.length - 1].time;

        entries.forEach(entry => {
            // Only draw visible setups or recent ones
            const isLong = entry.type === 'LONG';
            
            // @ts-ignore
            const x1 = timeScale.timeToCoordinate(entry.time);
            
            // Calculate end coordinate
            // If exitTime exists, use it. If not, trade is OPEN, extend to right edge or near future
            let x2 = width;
            let isActive = false;
            
            if (entry.exitTime) {
                // @ts-ignore
                const exitCoord = timeScale.timeToCoordinate(entry.exitTime);
                if (exitCoord !== null) {
                    x2 = exitCoord;
                } else {
                    // Exit time might be off screen to the right? Or not loaded?
                    // If exit time is later than last candle, it's weird, but handle it
                }
            } else {
                // Pending/Active trade
                isActive = true;
                x2 = width - 80; // Leave margin
            }
            
            // Skip if completely off screen to the left or right
            if (x1 === null && x2 < 0) return;
            // Note: x1 can be null if start is offscreen left, but setup continues onscreen.
            const startX = x1 !== null ? x1 : -100; 

            // Prevent drawing massive historical boxes if zoomed in far away from them
            // if (x2 < 0) return; 
            
            const boxWidth = Math.max(x2 - startX, 40); // Minimum width

            const yEntry = series.priceToCoordinate(entry.price);
            const ySL = series.priceToCoordinate(entry.sl);
            const yTP = series.priceToCoordinate(entry.tp);

            if (yEntry === null || ySL === null || yTP === null) return;

            // Colors
            const winColor = 'rgba(14, 203, 129, '; // Green
            const lossColor = 'rgba(246, 70, 93, '; // Red
            
            // For a Long Position:
            // TP is above Entry (Profit Zone) -> Green
            // SL is below Entry (Loss Zone) -> Red
            
            const tpFill = isLong ? winColor + '0.12)' : winColor + '0.12)';
            const tpStroke = isLong ? winColor + '0.5)' : winColor + '0.5)';
            
            const slFill = isLong ? lossColor + '0.12)' : lossColor + '0.12)';
            const slStroke = isLong ? lossColor + '0.5)' : lossColor + '0.5)';

            // Draw TP Box
            const hTP = yTP - yEntry; // Height from entry to TP
            ctx.fillStyle = tpFill;
            ctx.strokeStyle = tpStroke;
            ctx.lineWidth = 1;
            ctx.fillRect(startX, yEntry, boxWidth, hTP);
            ctx.strokeRect(startX, yEntry, boxWidth, hTP);
            
            // Draw SL Box
            const hSL = ySL - yEntry; // Height from entry to SL
            ctx.fillStyle = slFill;
            ctx.strokeStyle = slStroke;
            ctx.fillRect(startX, yEntry, boxWidth, hSL);
            ctx.strokeRect(startX, yEntry, boxWidth, hSL);

            // Entry Line (Neutral)
            ctx.beginPath();
            ctx.moveTo(startX, yEntry);
            ctx.lineTo(startX + boxWidth, yEntry);
            ctx.strokeStyle = '#78909c';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw connecting vertical line at Start
            ctx.beginPath();
            ctx.moveTo(startX, ySL);
            ctx.lineTo(startX, yTP);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Text Labels (Only if width is sufficient)
            if (boxWidth > 50 || isActive) {
                // R:R Label in middle
                const risk = Math.abs(entry.price - entry.sl);
                const reward = Math.abs(entry.price - entry.tp);
                const rr = reward / (risk || 1);
                
                // Draw Pill for RR
                const rrText = `${rr.toFixed(1)}`;
                drawLabel(rrText, startX + boxWidth/2, yEntry, '#555555', 'center');

                // TP Label
                if (Math.abs(hTP) > 15) {
                    const tpPct = (reward / entry.price) * 100;
                    drawLabel(`TP: ${tpPct.toFixed(2)}%`, startX + boxWidth/2, yTP + (isLong ? 10 : -10), winColor+'0.8)', 'center');
                }

                // SL Label
                if (Math.abs(hSL) > 15) {
                    const slPct = (risk / entry.price) * 100;
                    drawLabel(`SL: ${slPct.toFixed(2)}%`, startX + boxWidth/2, ySL + (isLong ? -10 : 10), lossColor+'0.8)', 'center');
                }
            }
            
            // Result Icon at end of box if closed
            if (!isActive && x2 > 0 && x2 < width) {
                const isWin = entry.backtestResult === 'WIN';
                ctx.font = '16px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(isWin ? '✅' : '❌', x2, yEntry);
            }
        });
    }
};
