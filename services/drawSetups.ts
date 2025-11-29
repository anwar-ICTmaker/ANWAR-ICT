
import { ISeriesApi, ITimeScaleApi, Time } from "lightweight-charts";
import { CandleData, EntrySignal } from "../types";

export const drawSetups = (
    ctx: CanvasRenderingContext2D,
    timeScale: ITimeScaleApi<Time>,
    series: ISeriesApi<"Candlestick">,
    data: CandleData[],
    entries: EntrySignal[],
    visible: boolean,
    width: number
) => {
    if (!visible || entries.length === 0 || data.length === 0) return;

    const visibleRange = timeScale.getVisibleLogicalRange();
    if (!visibleRange) return;
    
    // Get visible time boundaries to handle off-screen drawing
    const firstVisibleIndex = Math.max(0, Math.floor(visibleRange.from));
    const firstVisibleTime = data[firstVisibleIndex]?.time as number;

    // Helper to draw label
    const drawLabel = (text: string, x: number, y: number, color: string, align: 'left' | 'right' | 'center' = 'left', bg: string = '#ffffff') => {
        ctx.font = 'bold 10px Inter, sans-serif';
        const metrics = ctx.measureText(text);
        const pad = 4;
        const bgW = metrics.width + pad * 2;
        const bgH = 14;
        
        let drawX = x;
        if (align === 'right') drawX = x - bgW;
        if (align === 'center') drawX = x - bgW / 2;

        ctx.fillStyle = bg;
        ctx.beginPath();
        
        // Fix for roundRect TypeScript error / Browser compatibility
        // Cast ctx to any to avoid TS error 'Property roundRect does not exist on type CanvasRenderingContext2D'
        if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(drawX, y - bgH/2, bgW, bgH, 3);
        } else {
            // Fallback for older browsers
            ctx.rect(drawX, y - bgH/2, bgW, bgH);
        }
        
        ctx.fill();
        
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, drawX + pad, y);
    };

    entries.forEach(entry => {
        const entryTime = entry.time as number;
        const exitTime = entry.exitTime as number | undefined;

        // Skip if trade ended way before visible range
        if (exitTime && exitTime < (data[Math.max(0, firstVisibleIndex - 50)]?.time as number)) return;

        // Determine X coordinates
        let x1 = timeScale.timeToCoordinate(entry.time);
        let x2 = exitTime ? timeScale.timeToCoordinate(exitTime) : null;

        // Handle Start X (if offscreen left)
        if (x1 === null) {
            if (entryTime < firstVisibleTime) x1 = -10; // Allow drawing from left edge
            else return; // Should not happen if filtered correctly
        }

        // Handle End X
        let endX = x2 !== null ? x2 : width; 
        if (x2 === null) {
             if (exitTime) {
                 // Trade closed but exit point is offscreen right?
                 endX = width + 50; 
             } else {
                 // Open trade, extend to edge
                 endX = width; 
             }
        }

        // Don't draw if box is collapsed
        const boxWidth = Math.max(endX - x1, 40);
        if (endX < 0 || x1 > width) return;

        // Determine Y coordinates
        const yEntry = series.priceToCoordinate(entry.price);
        const ySL = series.priceToCoordinate(entry.sl);
        const yTP = series.priceToCoordinate(entry.tp);

        if (yEntry === null || ySL === null || yTP === null) return;

        const isLong = entry.type === 'LONG';
        const winColor = 'rgba(14, 203, 129, '; // Green
        const lossColor = 'rgba(246, 70, 93, '; // Red
        
        // Colors
        const profitFill = winColor + '0.15)';
        const profitStroke = winColor + '0.5)';
        const lossFill = lossColor + '0.15)';
        const lossStroke = lossColor + '0.5)';

        // --- DRAW "CAUSE" LINE (Exact Entry Indicator) ---
        // Draws a line from the entry candle to the logic level (e.g. OB High)
        if (entry.confluenceLevel) {
            const yConf = series.priceToCoordinate(entry.confluenceLevel);
            if (yConf !== null) {
                ctx.beginPath();
                ctx.moveTo(x1, yEntry);
                ctx.lineTo(x1 - 25, yConf); // Draw line back slightly
                ctx.strokeStyle = isLong ? '#0ecb81' : '#f6465d';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw a small dot at the confluence price
                ctx.beginPath();
                ctx.arc(x1 - 25, yConf, 2, 0, Math.PI * 2);
                ctx.fillStyle = isLong ? '#0ecb81' : '#f6465d';
                ctx.fill();

                // Small text indicating reason
                if (x1 > 30) {
                   ctx.fillStyle = '#848e9c';
                   ctx.font = 'italic 9px Inter';
                   ctx.fillText("Entry Cause", x1 - 50, yConf - 5);
                }
            }
        }

        // Draw Profit Box
        const hTP = yTP - yEntry;
        ctx.fillStyle = profitFill;
        ctx.strokeStyle = profitStroke;
        ctx.lineWidth = 1;
        ctx.fillRect(x1, yEntry, boxWidth, hTP);
        ctx.strokeRect(x1, yEntry, boxWidth, hTP);

        // Draw Loss Box
        const hSL = ySL - yEntry;
        ctx.fillStyle = lossFill;
        ctx.strokeStyle = lossStroke;
        ctx.fillRect(x1, yEntry, boxWidth, hSL);
        ctx.strokeRect(x1, yEntry, boxWidth, hSL);

        // Entry Line (Dashed)
        ctx.beginPath();
        ctx.moveTo(x1, yEntry);
        ctx.lineTo(x1 + boxWidth, yEntry);
        ctx.strokeStyle = '#78909c';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vertical connector line at start
        ctx.beginPath();
        ctx.moveTo(x1, ySL);
        ctx.lineTo(x1, yTP);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // LABELS
        if (boxWidth > 60) {
            const risk = Math.abs(entry.price - entry.sl);
            const reward = Math.abs(entry.price - entry.tp);
            const rr = reward / (risk || 1);

            // Risk/Reward Ratio Pill
            drawLabel(`R:R ${rr.toFixed(1)}`, x1 + boxWidth/2, yEntry, '#000000', 'center', '#e0e0e0');

            // TP Label
            if (Math.abs(hTP) > 20) {
                const tpPct = ((Math.abs(entry.price - entry.tp) / entry.price) * 100).toFixed(2);
                drawLabel(`Target: ${tpPct}%`, x1 + boxWidth/2, yTP + (isLong ? 12 : -12), '#0ecb81', 'center', '#1e222d');
            }

            // SL Label
            if (Math.abs(hSL) > 20) {
                 const slPct = ((Math.abs(entry.price - entry.sl) / entry.price) * 100).toFixed(2);
                 drawLabel(`Stop: ${slPct}%`, x1 + boxWidth/2, ySL + (isLong ? -12 : 12), '#f6465d', 'center', '#1e222d');
            }
        }
        
        // PnL/Result Icon at end
        if (entry.backtestResult !== 'PENDING' && x2 !== null && x2 < width - 20) {
             const isWin = entry.backtestResult === 'WIN';
             ctx.font = '14px Inter';
             ctx.textAlign = 'left';
             ctx.textBaseline = 'middle';
             ctx.fillStyle = isWin ? '#0ecb81' : '#f6465d';
             const icon = isWin ? '✅' : '❌';
             const pnlText = entry.backtestPnL ? ` $${Math.abs(entry.backtestPnL).toFixed(0)}` : '';
             ctx.fillText(icon + pnlText, x2 + 5, yEntry);
        }
    });
};
