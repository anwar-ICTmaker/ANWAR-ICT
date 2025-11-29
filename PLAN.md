
# ICT Trading Dashboard - Master Plan & Changelog

## 1. Project Overview
A professional-grade web-based trading terminal designed for **Inner Circle Trader (ICT)** concepts. It features real-time data analysis, algorithmic pattern detection, backtesting simulation, and paper trading capabilities.

## 2. Technical Architecture
*   **Frontend Framework**: React 18+ (TypeScript).
*   **Charting Engine**: `lightweight-charts` v5.0.
    *   *Rendering Strategy*: Hybrid approach using native Series for Candles/Histograms and a synchronized HTML5 `<canvas>` overlay for complex shapes (Zones, Boxes).
*   **Data Source**: Binance Public API (`api.binance.vision` / `api.binance.com`).
    *   *Proxies*: `PAXGUSDT` used for Gold (`XAUUSD`) and Micro Gold (`MGC`), Stablecoin pairs for Forex.
*   **State Management**: React `useState` / `useRef` for real-time ticks and chart synchronization.

## 3. Functional Specifications

### A. Charting & Visuals
*   **Candlestick Chart**: Standard price visualization.
*   **Session Killzones**: Asia, London, New York sessions background.
*   **Macro Times**: Gold background for macro windows (XX:50 - XX:10).
*   **Canvas Overlay (Zones)**:
    *   Order Blocks (OB), Fair Value Gaps (FVG).
    *   Premium/Discount Zones, MTF Levels.

### B. ICT Algorithms
*   **Structure**: Swing Points, BOS, CHoCH.
*   **Order Blocks**: Standard, Breaker, Swing subtypes.
*   **FVG**: Standard and Silver Bullet.
*   **Scanner**: Scoring system (0-10) based on confluences.

### C. Trading Simulator & Backtesting
*   **Paper Trading**: Manual/Auto execution.
*   **Backtest Engine**: 
    *   Simulates trades on loaded history (up to 1000 candles).
    *   **Risk Model**: Fixed Risk ($1000) per trade.
    *   **Lot Size**: Calculated dynamically (Risk / Stop Distance).
    *   **Metrics**: Win Rate, Net PnL, Profit Factor, Drawdown.

### D. User Interface (UI)
*   **Sidebar**: Navigation & Controls.
*   **Stats Dashboard**: 
    *   Interactive Trade History Table (Click for details).
    *   Win Rate & PnL cards.
*   **Setups Page**: 
    *   List of valid setups.
    *   **Proximity Alerts**: Visual warnings when price approaches a POI.
*   **Settings**: Configuration for colors, inputs, and visibility.

## 4. Change Log

### [Current Version] - Stats Overhaul & Alerts
*   **Action**: 
    *   Increased data fetch to 1000 candles.
    *   Added **Lot Size** calculation to setups.
    *   Created interactive **Trade History Table** in Stats.
    *   Added **Proximity Alerts** for upcoming setups.
*   **Status**: Implemented in `index.tsx`.

### [Previous Version] - ICT Macro Times
*   **Action**: Added visualization for Macro Times.
*   **Status**: Implemented in `index.tsx`.
