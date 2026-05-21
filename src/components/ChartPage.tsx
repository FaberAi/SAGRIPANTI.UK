"use client";
import { useEffect, useRef, useState, use } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";
import { sma, ema, bollingerBands, rsi, macd } from "@/lib/indicators";
import TradePanel from "./TradePanel";

interface OHLCV { time: number; open: number; high: number; low: number; close: number; volume: number; }

type Range = "1mo" | "3mo" | "6mo" | "1y" | "5y";
type Interval = "1d" | "1wk" | "1mo";

const RANGES: { label: string; value: Range; interval: Interval }[] = [
  { label: "1M", value: "1mo", interval: "1d" },
  { label: "3M", value: "3mo", interval: "1d" },
  { label: "6M", value: "6mo", interval: "1d" },
  { label: "1A", value: "1y", interval: "1wk" },
  { label: "5A", value: "5y", interval: "1wk" },
];

const INDICATORS = ["SMA20", "SMA50", "EMA12", "BB", "RSI", "MACD"];

export default function ChartPage({ paramsPromise }: { paramsPromise: Promise<{ symbol: string }> }) {
  const { symbol } = use(paramsPromise);
  const [range, setRange] = useState<typeof RANGES[0]>(RANGES[1]);
  const [activeIndicators, setActiveIndicators] = useState<string[]>(["SMA20"]);
  const [data, setData] = useState<OHLCV[]>([]);
  const [quote, setQuote] = useState<{ price: number; change: number; changePercent: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);
  const rsiApi = useRef<IChartApi | null>(null);
  const macdApi = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    fetch(`/api/market?symbol=${symbol}`)
      .then((r) => r.json())
      .then(setQuote);
  }, [symbol]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market?action=history&symbol=${symbol}&interval=${range.interval}&range=${range.value}`)
      .then((r) => r.json())
      .then((d: OHLCV[]) => {
        setData(d);
        setLoading(false);
      });
  }, [symbol, range]);

  // Build main chart
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Destroy old chart
    if (chartApi.current) {
      chartApi.current.remove();
      chartApi.current = null;
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 380,
      layout: { background: { type: ColorType.Solid, color: "#141d2e" }, textColor: "#64748b" },
      grid: { vertLines: { color: "#1e2d40" }, horzLines: { color: "#1e2d40" } },
      crosshair: { vertLine: { color: "#00d4ff44" }, horzLine: { color: "#00d4ff44" } },
      timeScale: { borderColor: "#1e2d40", timeVisible: true },
      rightPriceScale: { borderColor: "#1e2d40" },
    });
    chartApi.current = chart;

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#00ff88",
      downColor: "#ff4466",
      borderVisible: false,
      wickUpColor: "#00ff88",
      wickDownColor: "#ff4466",
    });
    candleSeries.current = candles;

    const candleData: CandlestickData<Time>[] = data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candles.setData(candleData);

    const closes = data.map((d) => d.close);

    if (activeIndicators.includes("SMA20")) {
      const smaLine = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1 });
      const smaData = sma(closes, 20);
      smaLine.setData(data.map((d, i) => ({ time: d.time as Time, value: smaData[i] })).filter((p) => !isNaN(p.value)));
    }
    if (activeIndicators.includes("SMA50")) {
      const smaLine = chart.addSeries(LineSeries, { color: "#8b5cf6", lineWidth: 1 });
      const smaData = sma(closes, 50);
      smaLine.setData(data.map((d, i) => ({ time: d.time as Time, value: smaData[i] })).filter((p) => !isNaN(p.value)));
    }
    if (activeIndicators.includes("EMA12")) {
      const emaLine = chart.addSeries(LineSeries, { color: "#06b6d4", lineWidth: 1, lineStyle: 2 });
      const emaData = ema(closes, 12);
      emaLine.setData(data.map((d, i) => ({ time: d.time as Time, value: emaData[i] })).filter((p) => !isNaN(p.value)));
    }
    if (activeIndicators.includes("BB")) {
      const bb = bollingerBands(closes, 20, 2);
      const upper = chart.addSeries(LineSeries, { color: "#475569", lineWidth: 1, lineStyle: 1 });
      const middle = chart.addSeries(LineSeries, { color: "#64748b", lineWidth: 1, lineStyle: 1 });
      const lower = chart.addSeries(LineSeries, { color: "#475569", lineWidth: 1, lineStyle: 1 });
      const toSeries = (arr: number[]) =>
        bb.map((b, i) => ({ time: data[i + 19].time as Time, value: arr[i] }));
      upper.setData(toSeries(bb.map((b) => b.upper)));
      middle.setData(toSeries(bb.map((b) => b.middle)));
      lower.setData(toSeries(bb.map((b) => b.lower)));
    }

    chart.timeScale().fitContent();
    return () => { chart.remove(); chartApi.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, activeIndicators]);

  // RSI sub-chart
  useEffect(() => {
    if (!rsiRef.current || !activeIndicators.includes("RSI") || data.length === 0) {
      if (rsiApi.current) { rsiApi.current.remove(); rsiApi.current = null; }
      return;
    }
    if (rsiApi.current) { rsiApi.current.remove(); }
    const chart = createChart(rsiRef.current, {
      width: rsiRef.current.clientWidth,
      height: 100,
      layout: { background: { type: ColorType.Solid, color: "#141d2e" }, textColor: "#64748b" },
      grid: { vertLines: { color: "#1e2d40" }, horzLines: { color: "#1e2d40" } },
      timeScale: { visible: false, borderColor: "#1e2d40" },
      rightPriceScale: { borderColor: "#1e2d40" },
    });
    rsiApi.current = chart;
    const closes = data.map((d) => d.close);
    const rsiVals = rsi(closes, 14);
    const rsiSeries = chart.addSeries(LineSeries, { color: "#a78bfa", lineWidth: 1 });
    rsiSeries.setData(rsiVals.map((v) => ({ time: data[v.time].time as Time, value: v.value })));
    return () => { chart.remove(); rsiApi.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, activeIndicators]);

  // MACD sub-chart
  useEffect(() => {
    if (!macdRef.current || !activeIndicators.includes("MACD") || data.length === 0) {
      if (macdApi.current) { macdApi.current.remove(); macdApi.current = null; }
      return;
    }
    if (macdApi.current) { macdApi.current.remove(); }
    const chart = createChart(macdRef.current, {
      width: macdRef.current.clientWidth,
      height: 100,
      layout: { background: { type: ColorType.Solid, color: "#141d2e" }, textColor: "#64748b" },
      grid: { vertLines: { color: "#1e2d40" }, horzLines: { color: "#1e2d40" } },
      timeScale: { visible: false, borderColor: "#1e2d40" },
      rightPriceScale: { borderColor: "#1e2d40" },
    });
    macdApi.current = chart;
    const closes = data.map((d) => d.close);
    const macdVals = macd(closes, 12, 26, 9);
    const macdSeries = chart.addSeries(LineSeries, { color: "#00d4ff", lineWidth: 1 });
    const sigSeries = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1 });
    const histSeries = chart.addSeries(HistogramSeries, {
      color: "#00ff88",
      priceScaleId: "hist",
    });
    macdSeries.setData(macdVals.map((v) => ({ time: data[v.time].time as Time, value: v.macd })));
    sigSeries.setData(macdVals.map((v) => ({ time: data[v.time].time as Time, value: v.signal })));
    histSeries.setData(macdVals.map((v) => ({
      time: data[v.time].time as Time,
      value: v.histogram,
      color: v.histogram >= 0 ? "#00ff8866" : "#ff446666",
    })));
    return () => { chart.remove(); macdApi.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, activeIndicators]);

  const toggleIndicator = (ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  const up = quote && quote.change >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#00d4ff" }}>{symbol}</div>
          {quote && <div style={{ color: "#64748b", fontSize: 12 }}>{quote.name}</div>}
          {quote && (
            <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "baseline" }}>
              <span style={{ fontSize: 20, fontWeight: 700 }}>${quote.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              <span className={up ? "ticker-up" : "ticker-down"} style={{ fontSize: 14 }}>
                {up ? "+" : ""}{quote.change.toFixed(2)} ({up ? "+" : ""}{quote.changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RANGES.map((r) => (
            <button
              key={r.value}
              className={range.value === r.value ? "btn-primary" : "btn-ghost"}
              onClick={() => setRange(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Indicators */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {INDICATORS.map((ind) => (
          <button
            key={ind}
            onClick={() => toggleIndicator(ind)}
            style={{
              padding: "3px 10px",
              fontSize: 10,
              fontFamily: "inherit",
              cursor: "pointer",
              borderRadius: 2,
              border: activeIndicators.includes(ind) ? "1px solid #00d4ff" : "1px solid #1e2d40",
              background: activeIndicators.includes(ind) ? "rgba(0,212,255,0.1)" : "transparent",
              color: activeIndicators.includes(ind) ? "#00d4ff" : "#64748b",
              letterSpacing: "0.05em",
            }}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            Caricamento dati...
          </div>
        )}
        <div ref={chartRef} style={{ width: "100%" }} />
        {activeIndicators.includes("RSI") && (
          <div style={{ borderTop: "1px solid #1e2d40" }}>
            <div style={{ padding: "4px 8px", fontSize: 10, color: "#a78bfa", letterSpacing: "0.05em" }}>RSI(14)</div>
            <div ref={rsiRef} style={{ width: "100%" }} />
          </div>
        )}
        {activeIndicators.includes("MACD") && (
          <div style={{ borderTop: "1px solid #1e2d40" }}>
            <div style={{ padding: "4px 8px", fontSize: 10, color: "#00d4ff", letterSpacing: "0.05em" }}>MACD(12,26,9)</div>
            <div ref={macdRef} style={{ width: "100%" }} />
          </div>
        )}
      </div>

      {/* Trade Panel */}
      <TradePanel symbol={symbol} currentPrice={quote?.price} />
    </div>
  );
}
