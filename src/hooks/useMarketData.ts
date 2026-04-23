import { useState, useEffect } from 'react';

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  history: { time: string; close: number }[];
  timestamp: string;
}

export function useMarketData(symbol: string, refreshInterval = 10000) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch data');
        }
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    timer = setInterval(fetchData, refreshInterval);

    return () => clearInterval(timer);
  }, [symbol, refreshInterval]);

  return { data, loading, error };
}
