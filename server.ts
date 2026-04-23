import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Task 1: The Proxy (getMarketData)
  app.get('/api/market-data', async (req, res) => {
    const { symbol, interval = '1m' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    try {
      const marketData = await fetchMarketData(symbol, String(interval));

      res.json({
        symbol,
        price: marketData.price,
        change: marketData.change,
        changePercent: marketData.changePercent,
        history: marketData.history,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(`Error fetching data for ${symbol}:`, error);
      res.status(500).json({ error: 'Failed to fetch market data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tradex server running on http://localhost:${PORT}`);
  });
}

async function fetchMarketData(symbol: string, interval: string) {
  if (symbol === '^NSEI') {
    return await fetchNifty50FromNse();
  }

  try {
    return await fetchMarketDataFromYahooApi(symbol, interval);
  } catch (apiError) {
    console.warn(`API fetch failed for ${symbol}, falling back to crawler`, apiError);
    return await crawlMarketDataFromYahooPage(symbol);
  }
}

async function fetchNifty50FromNse() {
  const baseHeaders = {
    'User-Agent': 'Mozilla/5.0',
    Accept: 'application/json,text/plain,*/*',
    Referer: 'https://www.nseindia.com/index-tracker/NIFTY%2050',
  };

  // NSE blocks direct API access unless session cookies are established first.
  const homeRes = await fetch('https://www.nseindia.com', { headers: baseHeaders });
  const cookie = homeRes.headers.get('set-cookie') || '';

  const dataRes = await fetch('https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050', {
    headers: {
      ...baseHeaders,
      cookie,
    },
  });

  if (!dataRes.ok) {
    throw new Error(`NSE index fetch failed with status ${dataRes.status}`);
  }

  const dataJson: any = await dataRes.json();
  const niftyRow = (dataJson?.data || []).find((item: any) => item.symbol === 'NIFTY 50') || dataJson?.data?.[0];
  if (!niftyRow) {
    throw new Error('NSE response missing NIFTY 50 data');
  }

  const price = Number(niftyRow.lastPrice);
  const change = Number(niftyRow.change);
  const changePercent = Number(niftyRow.pChange);

  const history: Array<{ time: string; close: number }> = [];
  try {
    const chartRes = await fetch('https://www.nseindia.com/api/chart-databyindex?index=NIFTY%2050&indices=true', {
      headers: {
        ...baseHeaders,
        cookie,
      },
    });

    if (chartRes.ok) {
      const chartJson: any = await chartRes.json();
      const points: any[] = chartJson?.grapthData || chartJson?.graphData || [];
      for (const point of points) {
        if (Array.isArray(point) && point.length >= 2) {
          history.push({ time: new Date(point[0]).toISOString(), close: Number(point[1]) });
        }
      }
    }
  } catch {
    // Keep price/change data even if chart data is unavailable.
  }

  return {
    price,
    change,
    changePercent,
    history,
  };
}

async function fetchMarketDataFromYahooApi(symbol: string, interval: string) {
  const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=${encodeURIComponent(interval)}`;

  const [quoteRes, chartRes] = await Promise.all([
    fetch(quoteUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    fetch(chartUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
  ]);

  if (!quoteRes.ok || !chartRes.ok) {
    throw new Error(`Yahoo API failed (${quoteRes.status}/${chartRes.status})`);
  }

  const quoteJson: any = await quoteRes.json();
  const chartJson: any = await chartRes.json();

  const quote = quoteJson?.quoteResponse?.result?.[0];
  const chartResult = chartJson?.chart?.result?.[0];
  const timestamps: number[] = chartResult?.timestamp || [];
  const closes: Array<number | null> = chartResult?.indicators?.quote?.[0]?.close || [];

  if (!quote || !quote.regularMarketPrice) {
    throw new Error('Missing quote data');
  }

  const history = timestamps
    .map((ts, i) => ({ time: new Date(ts * 1000).toISOString(), close: closes[i] }))
    .filter(point => typeof point.close === 'number') as Array<{ time: string; close: number }>;

  return {
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    history,
  };
}

async function crawlMarketDataFromYahooPage(symbol: string) {
  const pageUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
  const response = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) {
    throw new Error(`Crawler fetch failed with status ${response.status}`);
  }

  const html = await response.text();
  const price = extractNumber(html, /"regularMarketPrice"\s*:\s*\{"raw"\s*:\s*([-\d.]+)/);
  const change = extractNumber(html, /"regularMarketChange"\s*:\s*\{"raw"\s*:\s*([-\d.]+)/);
  const changePercent = extractNumber(html, /"regularMarketChangePercent"\s*:\s*\{"raw"\s*:\s*([-\d.]+)/);

  if (price == null) {
    throw new Error('Crawler could not parse market price');
  }

  return {
    price,
    change: change ?? 0,
    changePercent: changePercent ?? 0,
    history: [],
  };
}

function extractNumber(source: string, pattern: RegExp): number | null {
  const match = source.match(pattern);
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

startServer();
