
import React, { useEffect, useRef, useCallback } from 'react';
import { 
    createChart, 
    CandlestickSeries,
    ColorType, 
    IChartApi, 
    ISeriesApi, 
    SeriesMarker, 
    Time,
    HistogramSeries,
    IPriceLine
} from 'lightweight-charts';
import { CandleData, EntrySignal, FVG, OrderBlock, OverlayState, StructurePoint, TradeEntry, ColorTheme } from '../types';
import { drawCanvasLayer } from '../services/chartOverlay';

interface ChartProps {
    data: CandleData[];
    obs: OrderBlock[];
    fvgs: FVG[];
    structure: StructurePoint[];
    entries: EntrySignal[];
    overlays: OverlayState;
    colors: ColorTheme;
    onHoverEntry: (entry: EntrySignal | null) => void;
    onClickEntry: (entry: EntrySignal | null) => void;
    onToggleOverlay: () => void;
    pdRange: { high: number, low: number } | null;
    position: TradeEntry | null;
    htfObs: OrderBlock[];
    htfFvgs: FVG[];
    // New Props for Toggle controls
    setOverlays: (o: OverlayState) => void;
    onReload: () => void;
}

export const ChartComponent: React.FC<ChartProps> = (props) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const sessionSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const macroSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeTradeLinesRef = useRef<IPriceLine[]>([]);
    const mousePos = useRef<{ x: number, y: number } | null>(null);
    const drawCanvasOverlayRef = useRef<() => void>(() => {});

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;
        
        if (chartRef.current) {
            try {
                chartRef.current.remove();
            } catch (e) { console.warn('Chart cleanup warning', e); }
            chartRef.current = null;
            candleSeriesRef.current = null;
            sessionSeriesRef.current = null;
            macroSeriesRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#d1d4dc' },
            grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: { timeVisible: true, secondsVisible: false },
            rightPriceScale: { visible: true, borderColor: '#2B2B43' },
            leftPriceScale: { visible: false, borderColor: '#2B2B43' },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
             upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
             priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
        });
        
        const sessionSeries = chart.addSeries(HistogramSeries, {
            color: 'rgba(255, 255, 255, 0)', priceScaleId: 'left', priceFormat: { type: 'custom', formatter: () => '' }
        });
        
        const macroSeries = chart.addSeries(HistogramSeries, {
            color: 'rgba(255, 215, 0, 0.2)', priceScaleId: 'left', priceFormat: { type: 'custom', formatter: () => '' }
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        sessionSeriesRef.current = sessionSeries;
        macroSeriesRef.current = macroSeries;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        
        chart.subscribeCrosshairMove(param => {
            if (param.point) {
                mousePos.current = param.point;
            } else {
                mousePos.current = null;
            }
            
            if (drawCanvasOverlayRef.current) {
                requestAnimationFrame(drawCanvasOverlayRef.current);
            }

            if (param.time && props.entries.length > 0) {
                const e = props.entries.find((x: any) => Math.abs(x.time - (param.time as number)) < 300);
                props.onHoverEntry(e || null);
            } else props.onHoverEntry(null);
        });
        
        chart.subscribeClick(param => {
            if (param.time) {
                const e = props.entries.find((x: any) => x.time === param.time);
                if (e) props.onClickEntry(e);
            }
        });

        chart.timeScale().subscribeVisibleTimeRangeChange(() => {
            if (drawCanvasOverlayRef.current) {
                requestAnimationFrame(drawCanvasOverlayRef.current);
            }
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                try {
                    chartRef.current.remove();
                } catch(e) {}
                chartRef.current = null;
                candleSeriesRef.current = null;
            }
        };
    }, []);

    const handleZoom = (delta: number) => {
        const chart = chartRef.current;
        if (chart) {
            const timeScale = chart.timeScale();
            // @ts-ignore
            const currentSpacing = timeScale.options().barSpacing || 6;
            const newSpacing = currentSpacing * delta;
            if(newSpacing > 0.5 && newSpacing < 100)
                timeScale.applyOptions({ barSpacing: newSpacing });
        }
    };

    // Update Data
    useEffect(() => {
        if (candleSeriesRef.current && props.data.length > 0) {
             const coloredData = props.data.map((d: any) => {
                const isEntry = props.entries.find((e: any) => e.time === d.time);
                const hour = new Date(d.time * 1000).getUTCHours();
                const isSB = (hour === 14 || hour === 9 || hour === 3);
                let color = undefined; let borderColor = undefined;
                if (isEntry && isEntry.score >= 7) { color = '#FFFF00'; borderColor = '#FFFF00'; }
                else if (isSB && props.overlays.silverBullet) { borderColor = '#FFD700'; }
                return { ...d, color, borderColor };
            });
            candleSeriesRef.current.setData(coloredData);
        }
    }, [props.data, props.entries, props.overlays]);

    // Update Sessions & Macro
    useEffect(() => {
        if (sessionSeriesRef.current && props.data.length > 0) {
            const sData = props.data.map((d: any) => {
                const h = new Date(d.time * 1000).getUTCHours();
                let color = 'transparent';
                let value = 0;
                if (props.overlays.killzones) {
                    if (h >= 0 && h < 8) { color = 'rgba(255, 165, 0, 0.15)'; value = 1; }
                    else if (h >= 7 && h < 16) { color = 'rgba(41, 98, 255, 0.15)'; value = 1; }
                    else if (h >= 12 && h < 21) { color = 'rgba(0, 230, 118, 0.15)'; value = 1; }
                }
                return { time: d.time, value, color };
            });
            sessionSeriesRef.current.setData(sData);
        }
        if (macroSeriesRef.current && props.data.length > 0) {
             const mData = props.data.map((d: any) => {
                const m = new Date(d.time * 1000).getUTCMinutes();
                let value = 0;
                if (props.overlays.macro && (m >= 50 || m <= 10)) value = 1; 
                return { time: d.time, value, color: value ? 'rgba(255, 215, 0, 0.15)' : 'transparent' };
             });
             macroSeriesRef.current.setData(mData);
        }
    }, [props.data, props.overlays]);

    // Update Markers & Trade Lines (Active Position Only)
    useEffect(() => {
        if (!candleSeriesRef.current) return;
        
        try {
             activeTradeLinesRef.current.forEach(l => candleSeriesRef.current?.removePriceLine(l));
             activeTradeLinesRef.current = [];
             
             // Removed historicalTradeLinesRef logic as it is now handled by Canvas Layer

            if (props.position) {
                activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ price: props.position.price, color: '#2962FF', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'ENTRY' }));
                if (props.position.stopLoss) activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ price: props.position.stopLoss, color: '#ef5350', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'SL' }));
                if (props.position.takeProfit) activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ price: props.position.takeProfit, color: '#00E676', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'TP' }));
            }

            const markers: SeriesMarker<Time>[] = [];
            if (props.overlays.swingStructure) {
                props.structure.forEach((s: any) => {
                     if (['HH','HL','LH','LL'].includes(s.type))
                        markers.push({ time: s.time, position: s.type.includes('H')?'aboveBar':'belowBar', color: s.type.includes('H')?'#ef5350':'#26a69a', shape: s.type.includes('H')?'arrowDown':'arrowUp', text: s.type });
                });
            }
            if (props.overlays.internalStructure) {
                 props.structure.forEach((s: any) => {
                     if (['BOS','CHoCH'].includes(s.type))
                    // @ts-ignore
                        markers.push({ time: s.time, position: s.type.includes('BOS') ? (s.direction==='Bullish'?'belowBar':'aboveBar') : 'aboveBar', color: s.type==='BOS'?'#2962FF':'#E040FB', shape: 'none', text: s.type });
                });
            }
            if (props.overlays.backtestMarkers) {
                props.entries.forEach((e: any) => {
                    const grade = e.setupGrade ? `[${e.setupGrade}] ` : '';
                    // @ts-ignore
                    markers.push({ time: e.time, position: e.type==='LONG'?'belowBar':'aboveBar', color: e.type==='LONG'?'#00E676':'#FF1744', shape: e.type==='LONG'?'arrowUp':'arrowDown', text: `${grade}${e.type}` });
                });
            }
            
            const series: any = candleSeriesRef.current;
            if (series && typeof series.setMarkers === 'function') {
                series.setMarkers(markers);
            }

        } catch (err) {
            console.warn("Error updating chart markers/lines:", err);
        }

        requestAnimationFrame(drawCanvasOverlay);
    }, [props.position, props.structure, props.entries, props.overlays, props.data]);

    // Canvas Overlay Drawing
    const drawCanvasOverlay = useCallback(() => {
        const chart = chartRef.current;
        const canvas = canvasRef.current;
        const container = chartContainerRef.current;
        const series = candleSeriesRef.current;
        if (!chart || !canvas || !container || !series) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const pixelRatio = window.devicePixelRatio || 1;
        if (canvas.width !== container.clientWidth * pixelRatio || canvas.height !== container.clientHeight * pixelRatio) {
            canvas.width = container.clientWidth * pixelRatio;
            canvas.height = container.clientHeight * pixelRatio;
            canvas.style.width = container.clientWidth + "px";
            canvas.style.height = container.clientHeight + "px";
            ctx.scale(pixelRatio, pixelRatio);
        }
        
        const timeScale = chart.timeScale();

        // Delegate drawing to the service
        drawCanvasLayer(
            ctx, 
            timeScale, 
            series, 
            props.data, 
            props.obs, 
            props.fvgs, 
            props.entries, 
            props.overlays, 
            props.colors, 
            props.pdRange, 
            container.clientWidth, 
            container.clientHeight,
            props.htfObs,
            props.htfFvgs
        );

    }, [props.data, props.obs, props.fvgs, props.htfObs, props.htfFvgs, props.entries, props.pdRange, props.overlays, props.colors]);

    useEffect(() => {
        drawCanvasOverlayRef.current = drawCanvasOverlay;
        requestAnimationFrame(drawCanvasOverlay);
    }, [drawCanvasOverlay]);

    return (
        <div className="relative w-full h-full flex flex-col">
            <div ref={chartContainerRef} className="flex-1 w-full h-full overflow-hidden" />
            <canvas ref={canvasRef} className="absolute top-0 left-0 pointer-events-none z-10" />
            
            {/* Zoom Controls */}
            <div className="absolute bottom-16 right-4 flex flex-col gap-2 z-30">
                <button onClick={() => handleZoom(0.8)} className="bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700 shadow-lg border border-gray-600 opacity-80">+</button>
                <button onClick={() => handleZoom(1.2)} className="bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700 shadow-lg border border-gray-600 opacity-80">-</button>
            </div>

            {/* Top Toolbar for Overlays and Reload */}
            <div className="absolute top-4 right-16 z-20 flex items-center gap-2">
                 <button 
                    onClick={() => {
                        props.setOverlays({...props.overlays, historicalTradeLines: !props.overlays.historicalTradeLines});
                        if (props.onReload) props.onReload(); // Trigger redraw/recalc if needed
                    }}
                    className={`p-2 rounded text-xs font-bold border transition-colors backdrop-blur-sm shadow-sm
                        ${props.overlays.historicalTradeLines ? 'bg-blue-600/80 border-blue-400 text-white' : 'bg-gray-800/80 border-gray-600 text-gray-400'}
                    `}
                >
                    {props.overlays.historicalTradeLines ? 'SETUPS ON' : 'SETUPS OFF'}
                </button>
                <button 
                    onClick={props.onToggleOverlay} 
                    className={`p-2 rounded text-xs font-bold border transition-colors backdrop-blur-sm shadow-sm
                         ${props.overlays.killzones ? 'bg-purple-600/80 border-purple-400 text-white' : 'bg-gray-800/80 border-gray-600 text-gray-400'}
                    `}
                >
                    {props.overlays.killzones ? 'SESSIONS' : 'SESSIONS'}
                </button>
                <button 
                    onClick={props.onReload} 
                    className="p-2 rounded text-xs font-bold bg-gray-700/80 hover:bg-gray-600/80 text-white border border-gray-500 backdrop-blur-sm transition-colors flex items-center gap-1"
                >
                    <span>↻</span> RELOAD
                </button>
            </div>
        </div>
    );
};
