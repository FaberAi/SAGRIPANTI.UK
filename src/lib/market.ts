export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  type: "stock" | "crypto" | "index";
}

export interface OHLCV {
  time: number; // unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const CRYPTO_SYMBOLS = new Set([
  "BTC", "ETH", "BNB", "SOL", "ADA", "DOGE", "XRP", "DOT", "AVAX", "MATIC",
]);
const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin", SOL: "solana",
  ADA: "cardano", DOGE: "dogecoin", XRP: "ripple", DOT: "polkadot",
  AVAX: "avalanche-2", MATIC: "matic-network",
};

function isCrypto(symbol: string) {
  return CRYPTO_SYMBOLS.has(symbol.toUpperCase());
}

// fetch con ritentativi: Yahoo/CoinGecko ogni tanto fanno rate-limit (429)
// o danno errori 5xx transitori. Si ritenta con backoff prima di arrendersi.
async function fetchRetry(url: string, init?: RequestInit, tries = 3): Promise<Response> {
  let lastErr: unknown = new Error("fetch fallito");
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status !== 429 && res.status < 500)) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error("fetch fallito");
}

// Yahoo Finance chart API – no auth needed
async function yahooChart(symbol: string, interval: string, range: string) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const res = await fetchRetry(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Yahoo API error ${res.status} for ${symbol}`);
  return res.json() as Promise<{
    chart: {
      result: Array<{
        meta: {
          regularMarketPrice: number;
          previousClose?: number;
          chartPreviousClose?: number;
          longName?: string;
          shortName?: string;
          regularMarketVolume: number;
          marketCap?: number;
          instrumentType: string;
        };
        timestamp: number[];
        indicators: {
          quote: Array<{ open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] }>;
        };
      }> | null;
    };
  }>;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const upper = symbol.toUpperCase();
  if (isCrypto(upper)) return getCryptoQuote(upper);

  const data = await yahooChart(symbol, "1d", "5d");
  const result = data.chart.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const meta = result.meta;
  const price = meta.regularMarketPrice;

  // `previousClose` non è sempre presente nel meta del range 5d: ricadiamo su
  // `chartPreviousClose` e, in ultima istanza, sull'ultima chiusura valida
  // della serie storica, così change/changePercent non risultano mai null.
  const closes = result.indicators.quote[0]?.close ?? [];
  const lastValidClose = [...closes].reverse().find((c) => typeof c === "number" && c > 0);
  const prev =
    meta.previousClose ?? meta.chartPreviousClose ?? lastValidClose ?? price;
  const change = price - prev;
  return {
    symbol: upper,
    name: meta.longName ?? meta.shortName ?? symbol,
    price,
    change,
    changePercent: (change / prev) * 100,
    volume: meta.regularMarketVolume ?? 0,
    marketCap: meta.marketCap,
    type: meta.instrumentType === "INDEX" ? "index" : "stock",
  };
}

async function getCryptoQuote(symbol: string): Promise<Quote> {
  const id = CRYPTO_IDS[symbol];
  const res = await fetchRetry(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
  );
  const data = await res.json() as Record<string, { usd: number; usd_24h_change: number; usd_market_cap: number; usd_24h_vol: number }>;
  const coin = data[id];
  return {
    symbol,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    price: coin.usd,
    change: (coin.usd * (coin.usd_24h_change ?? 0)) / 100,
    changePercent: coin.usd_24h_change ?? 0,
    volume: coin.usd_24h_vol ?? 0,
    marketCap: coin.usd_market_cap,
    type: "crypto",
  };
}

export async function getHistoricalData(
  symbol: string,
  interval: "1d" | "1wk" | "1mo" = "1d",
  range: "1mo" | "3mo" | "6mo" | "1y" | "5y" = "3mo"
): Promise<OHLCV[]> {
  const upper = symbol.toUpperCase();

  if (isCrypto(upper)) {
    return getCryptoHistory(upper, range);
  }

  const data = await yahooChart(symbol, interval, range);
  const result = data.chart.result?.[0];
  if (!result) return [];

  const { timestamp, indicators } = result;
  const ohlcv = indicators.quote[0];
  return timestamp
    .map((t, i) => ({
      time: t,
      open: ohlcv.open[i],
      high: ohlcv.high[i],
      low: ohlcv.low[i],
      close: ohlcv.close[i],
      volume: ohlcv.volume[i] ?? 0,
    }))
    .filter((d) => d.open && d.high && d.low && d.close);
}

async function getCryptoHistory(symbol: string, range: string): Promise<OHLCV[]> {
  const id = CRYPTO_IDS[symbol];
  const daysMap: Record<string, number> = { "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "5y": 1825 };
  const days = daysMap[range] ?? 90;
  const res = await fetchRetry(
    `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`
  );
  const data = await res.json() as number[][];
  return data.map(([ts, o, h, l, c]) => ({
    time: Math.floor(ts / 1000),
    open: o, high: h, low: l, close: c, volume: 0,
  }));
}

export const DEFAULT_WATCHLIST = [
  "AAPL", "MSFT", "GOOGL", "NVDA", "ENI.MI", "ISP.MI",
  "BTC", "ETH",
  "^GSPC", "^FTMIB",
];
