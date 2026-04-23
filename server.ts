import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';
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
      // Fetch quote and historical data
      const [quote, history]: [any, any] = await Promise.all([
        yahooFinance.quoteSummary(symbol, { modules: ['price'] }),
        yahooFinance.chart(symbol, {
          period1: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // Last 24 hours
          interval: interval as any,
        }),
      ]);

      res.json({
        symbol,
        price: quote.price?.regularMarketPrice || history.meta.regularMarketPrice,
        change: quote.price?.regularMarketChange,
        changePercent: quote.price?.regularMarketChangePercent,
        history: history.quotes.map(q => ({
          time: q.date,
          close: q.close,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(`Error fetching data for ${symbol}:`, error);
      if (error.name === 'YahooFinanceError' && error.message.includes('429')) {
        return res.status(429).json({ error: 'Market data provider rate limit exceeded' });
      }
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

startServer();
