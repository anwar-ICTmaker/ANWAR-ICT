
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { 
    createChart, 
    CandlestickSeries,
    ColorType, 
    IChartApi, 
    ISeriesApi, 
    SeriesMarker, 
    Time,
    HistogramSeries,
    IPriceLine,
    CrosshairMode
} from 'lightweight-charts';
import { CandleData, EntrySignal, FVG, OrderBlock, OverlayState, StructurePoint, TradeEntry, ColorTheme } from '../types';
import { drawCanvasLayer } from '../services/chartOverlay';
import { ChartControls } from './ChartControls';
import { ReplayControls } from './ReplayControls';

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
    setOverlays: (o: OverlayState) => void;
    onReload: () => void;
    setupVisibility: 'ALL' | 'FOCUS' | 'NONE';
    setSetupVisibility: (mode: 'ALL' | 'FOCUS' | 'NONE') => void;
    focusedEntry: EntrySignal | null;
    
    // Replay Props
    replayState: {
        active: boolean;
        index: number;
        playing: boolean;
        speed: number;
        maxIndex: number;
    };
    onReplayControl: {
        togglePlay: () => void;
        changeSpeed: () => void;
        exit: () => void;
        seek: (val: number) => void;
    }
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

    // Filtered Entries based on Visibility Mode and Replay Time
    const visibleEntries = useMemo(() => {
        let list = props.entries;
        
        // If replay active, filter out entries from the future
        if (props.replayState.active && props.data.length > 0) {
            const lastTime = props.data[props.data.length - 1].time as number;
            list = list.filter(e => (e.time as number) <= lastTime);
        }

        if (props.setupVisibility === 'NONE') return [];
        if (props.setupVisibility === 'FOCUS' && props.focusedEntry) {
            // Check if focused entry is still valid in replay time
            if (props.replayState.active) {
                const lastTime = props.data[props.data.length - 1].time as number;
                if ((props.focusedEntry.time as number) > lastTime) return []; 
            }
            return [props.focusedEntry];
        }
        return list;
    }, [props.entries, props.setupVisibility, props.focusedEntry, props.replayState.active, props.data]);

    // Zoom to focused entry effect (Only when not in replay or initial replay setup)
    useEffect(() => {
        if (props.setupVisibility === 'FOCUS' && props.focusedEntry && chartRef.current && props.data.length > 0) {
            // Avoid auto-zooming constantly during replay playback to allow user control
            if (props.replayState.active && props.replayState.playing) return;

            const chart = chartRef.current;
            const entryTime = props.focusedEntry.time as number;
            const exitTime = props.focusedEntry.exitTime as number | undefined;
            
            // Find index of the entry candle
            const entryIndex = props.data.findIndex(d => d.time === entryTime);
            
            if (entryIndex !== -1) {
                let toIndex = entryIndex + 50;
                if (exitTime) {
                    const exitIndex = props.data.findIndex(d => d.time === exitTime);
                    if (exitIndex !== -1) {
                         toIndex = exitIndex + 20; 
                    }
                }
                
                const fromIndex = Math.max(0, entryIndex - 30); 
                toIndex = Math.min(props.data.length - 1, toIndex);
                
                chart.timeScale().setVisibleLogicalRange({ from: fromIndex, to: toIndex });
            }
        }
    }, [props.focusedEntry, props.setupVisibility, props.data.length]); // Dep change to avoid re-trigger on data update during replay

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
            layout: { background: { type: ColorType.Solid, color: '#0b0e11' }, textColor: '#848e9c' },
            grid: { vertLines: { color: '#151924' }, horzLines: { color: '#151924' } },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: { timeVisible: true, secondsVisible: false },
            rightPriceScale: { visible: true, borderColor: '#2a2e39' },
            leftPriceScale: { visible: false, borderColor: '#2a2e39' },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { labelBackgroundColor: '#2962FF', color: '#2a2e39' },
                horzLine: { labelBackgroundColor: '#2962FF', color: '#2a2e39' },
            },
            handleScale: { pinch: true, mouseWheel: true, axisPressedMouseMove: true },
            handleScroll: { vertTouchDrag: false, horzTouchDrag: true, pressedMouseMove: true, mouseWheel: true },
            kineticScroll: { touch: true, mouse: true }
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
             upColor: '#0ecb81', downColor: '#f6465d', borderVisible: false, wickUpColor: '#0ecb81', wickDownColor: '#f6465d',
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
            if (param.point) mousePos.current = param.point;
            else mousePos.current = null;
            if (drawCanvasOverlayRef.current) requestAnimationFrame(drawCanvasOverlayRef.current);
            if (param.time && visibleEntries.length > 0) {
                const e = visibleEntries.find((x: any) => Math.abs(x.time - (param.time as number)) < 300);
                props.onHoverEntry(e || null);
            } else props.onHoverEntry(null);
        });
        
        chart.subscribeClick(param => {
            if (param.time) {
                const clickTime = param.time as number;
                const e = visibleEntries.find((x: any) => Math.abs(x.time - clickTime) < 300); // 5 min tolerance
                if (e) props.onClickEntry(e);
            }
        });

        chart.timeScale().subscribeVisibleTimeRangeChange(() => {
            if (drawCanvasOverlayRef.current) requestAnimationFrame(drawCanvasOverlayRef.current);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                try { chartRef.current.remove(); } catch(e) {}
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
                // Highlight focused entry candle
                const isFocused = props.setupVisibility === 'FOCUS' && props.focusedEntry && d.time === props.focusedEntry.time;
                const isEntry = visibleEntries.find((e: any) => e.time === d.time);
                const hour = new Date(d.time * 1000).getUTCHours();
                const isSB = (hour === 14 || hour === 9 || hour === 3);
                
                let color = undefined; 
                let borderColor = undefined;

                if (isFocused) { color = '#ffffff'; borderColor = '#ffffff'; }
                else if (isEntry && isEntry.score >= 7) { color = '#FFFF00'; borderColor = '#FFFF00'; }
                else if (isSB && props.overlays.silverBullet) { borderColor = '#FFD700'; }
                
                return { ...d, color, borderColor };
            });
            candleSeriesRef.current.setData(coloredData);
            
            // Auto-scroll logic for Replay Playback
            if (props.replayState.active && props.replayState.playing && chartRef.current) {
                 // Check if latest candle is visible, if not, scroll to it
                 const timeScale = chartRef.current.timeScale();
                 const range = timeScale.getVisibleLogicalRange();
                 if (range) {
                    const distFromRight = props.data.length - range.to;
                    if (distFromRight < 10) {
                         timeScale.scrollToRealTime(); 
                    }
                 }
            }
        }
    }, [props.data, visibleEntries, props.overlays, props.focusedEntry, props.setupVisibility, props.replayState.playing]);

    // Update Sessions & Macro
    useEffect(() => {
        if (sessionSeriesRef.current && props.data.length > 0) {
            const sData = props.data.map((d: any) => {
                const h = new Date(d.time * 1000).getUTCHours();
                let color = 'transparent';
                let value = 0;
                if (props.overlays.killzones) {
                    if (h >= 0 && h < 8) { color = 'rgba(255, 165, 0, 0.08)'; value = 1; }
                    else if (h >= 7 && h < 16) { color = 'rgba(41, 98, 255, 0.08)'; value = 1; }
                    else if (h >= 12 && h < 21) { color = 'rgba(0, 230, 118, 0.08)'; value = 1; }
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
                return { time: d.time, value, color: value ? 'rgba(255, 215, 0, 0.1)' : 'transparent' };
             });
             macroSeriesRef.current.setData(mData);
        }
    }, [props.data, props.overlays]);

    // Update Markers & Trade Lines
    useEffect(() => {
        if (!candleSeriesRef.current) return;
        try {
             activeTradeLinesRef.current.forEach(l => candleSeriesRef.current?.removePriceLine(l));
             activeTradeLinesRef.current = [];
            if (props.position) {
                activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ 
                    price: props.position.price, color: '#2962FF', lineWidth: 3, lineStyle: 0, axisLabelVisible: true, title: 'ENTRY' 
                }));
                if (props.position.stopLoss) {
                    activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ 
                        price: props.position.stopLoss, color: '#FF1744', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'SL' 
                    }));
                }
                if (props.position.takeProfit) {
                    activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ 
                        price: props.position.takeProfit, color: '#00E676', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'TP' 
                    }));
                }
            }
            const markers: SeriesMarker<Time>[] = [];
            
            // Only draw structure if within replay time
            const lastTime = props.data.length > 0 ? props.data[props.data.length - 1].time as number : Infinity;

            if (props.overlays.swingStructure) {
                props.structure.filter(s => (s.time as number) <= lastTime).forEach((s: any) => {
                     if (['HH','HL','LH','LL'].includes(s.type))
                        markers.push({ time: s.time, position: s.type.includes('H')?'aboveBar':'belowBar', color: s.type.includes('H')?'#ef5350':'#0ecb81', shape: s.type.includes('H')?'arrowDown':'arrowUp', text: s.type });
                });
            }
            if (props.overlays.internalStructure) {
                 props.structure.filter(s => (s.time as number) <= lastTime).forEach((s: any) => {
                     if (['BOS','CHoCH'].includes(s.type))
                        // @ts-ignore
                        markers.push({ time: s.time, position: s.type.includes('BOS') ? (s.direction==='Bullish'?'belowBar':'aboveBar') : 'aboveBar', color: s.type==='BOS'?'#2962FF':'#E040FB', shape: 'none', text: s.type });
                });
            }
            if (props.overlays.backtestMarkers && props.setupVisibility !== 'NONE') {
                visibleEntries.forEach((e: any) => {
                    const grade = e.setupGrade ? `[${e.setupGrade}] ` : '';
                    // @ts-ignore
                    markers.push({ time: e.time, position: e.type==='LONG'?'belowBar':'aboveBar', color: e.type==='LONG'?'#00E676':'#FF1744', shape: e.type==='LONG'?'arrowUp':'arrowDown', text: `${grade}${e.type}` });
                });
            }
            // @ts-ignore
            if (candleSeriesRef.current.setMarkers) candleSeriesRef.current.setMarkers(markers);

        } catch (err) { console.warn("Error updating chart markers/lines:", err); }
        requestAnimationFrame(drawCanvasOverlay);
    }, [props.position, props.structure, visibleEntries, props.overlays, props.data, props.setupVisibility]);

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

        drawCanvasLayer(
            ctx, timeScale, series, props.data, props.obs, props.fvgs, visibleEntries, props.overlays, props.colors, props.pdRange, container.clientWidth, container.clientHeight, props.htfObs, props.htfFvgs
        );
    }, [props.data, props.obs, props.fvgs, props.htfObs, props.htfFvgs, visibleEntries, props.pdRange, props.overlays, props.colors]);

    useEffect(() => {
        drawCanvasOverlayRef.current = drawCanvasOverlay;
        requestAnimationFrame(drawCanvasOverlay);
    }, [drawCanvasOverlay]);

    return (
        <div className="relative w-full h-full flex flex-col">
            <div ref={chartContainerRef} className="flex-1 w-full h-full overflow-hidden" />
            <canvas ref={canvasRef} className="absolute top-0 left-0 pointer-events-none z-10" />
            
            <div className="absolute bottom-16 right-4 flex flex-col gap-2 z-30 pointer-events-auto">
                <button onClick={() => handleZoom(0.8)} className="w-10 h-10 bg-[#1e222d] text-white rounded-full hover:bg-gray-700 shadow-lg border border-gray-600 flex items-center justify-center opacity-80 transition-opacity hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button onClick={() => handleZoom(1.2)} className="w-10 h-10 bg-[#1e222d] text-white rounded-full hover:bg-gray-700 shadow-lg border border-gray-600 flex items-center justify-center opacity-80 transition-opacity hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>

            <ChartControls 
                overlays={props.overlays} 
                setOverlays={props.setOverlays}
                setupVisibility={props.setupVisibility}
                setSetupVisibility={props.setSetupVisibility}
                onReload={props.onReload}
                focusedEntry={props.focusedEntry}
            />

            <ReplayControls 
                isActive={props.replayState.active}
                isPlaying={props.replayState.playing}
                speed={props.replayState.speed}
                currentIndex={props.replayState.index}
                maxIndex={props.replayState.maxIndex}
                currentDate={props.data.length > 0 ? props.data[props.data.length-1].time as number : 0}
                onPlayPause={props.onReplayControl.togglePlay}
                onSpeedChange={props.onReplayControl.changeSpeed}
                onExit={props.onReplayControl.exit}
                onSeek={(e) => props.onReplayControl.seek(parseInt(e.target.value))}
            />
        </div>
    );
};
