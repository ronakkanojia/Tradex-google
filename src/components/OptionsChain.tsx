import React, { useMemo } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { calculateBlackScholes } from '../utils/blackScholes';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, Info, Loader2 } from 'lucide-react';

export default function OptionsChain() {
  const { data: niftyData, loading: niftyLoading, error: niftyError } = useMarketData('^NSEI');
  const { data: vixData, loading: vixLoading, error: vixError } = useMarketData('^INDIAVIX');

  const underlyingPrice = niftyData?.price || 0;
  const iv = (vixData?.price || 15) / 100;
  const riskFreeRate = 0.065;
  const timeToExpiry = 7 / 365; // Assume 1 week to expiry for intraday simulation

  const strikes = useMemo(() => {
    if (!underlyingPrice) return [];
    
    // Generate strikes in increments of 50
    const atmStrike = Math.round(underlyingPrice / 50) * 50;
    const strikeArray = [];
    for (let i = -5; i <= 5; i++) {
      strikeArray.push(atmStrike + i * 50);
    }
    return strikeArray;
  }, [underlyingPrice]);

  const chainData = useMemo(() => {
    if (!underlyingPrice || !strikes.length) return [];

    return strikes.map(strike => {
      const call = calculateBlackScholes(underlyingPrice, strike, timeToExpiry, riskFreeRate, iv, true);
      const put = calculateBlackScholes(underlyingPrice, strike, timeToExpiry, riskFreeRate, iv, false);
      return { strike, call, put };
    });
  }, [underlyingPrice, strikes, iv]);

  if (niftyLoading || vixLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-zinc-400 font-mono uppercase tracking-widest text-xs">Calibrating Market Streams...</span>
      </div>
    );
  }

  if (niftyError || vixError) {
    return (
      <div className="p-8 border border-red-900/30 bg-red-950/20 rounded-lg text-red-500 font-mono text-sm">
        <div className="flex items-center mb-2">
          <Info className="w-4 h-4 mr-2" />
          <span className="font-bold">CONNECTION_FAILURE</span>
        </div>
        {niftyError || vixError}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Asset Card 1: Nifty 50 */}
      <div className="lg:col-span-3 bento-card flex flex-col justify-between min-h-[160px]">
        <div className="flex justify-between items-start">
          <div className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-400 font-mono tracking-tighter">INDEX</div>
          <div className={`text-xs font-medium flex items-center ${niftyData?.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {niftyData?.change >= 0 ? '+' : ''}{niftyData?.changePercent?.toFixed(2)}%
          </div>
        </div>
        <div>
          <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">NIFTY 50 (^NSEI)</h2>
          <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
            {underlyingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="w-full h-8 flex items-end space-x-1 opacity-20">
          {[40, 60, 45, 70, 85, 60, 50, 40, 30, 45, 60].map((h, i) => (
            <div key={i} className="bg-emerald-500 w-full rounded-t-sm" style={{ height: `${h}%` }}></div>
          ))}
        </div>
      </div>

      {/* Asset Card 2: India VIX */}
      <div className="lg:col-span-3 bento-card flex flex-col justify-between min-h-[160px]">
        <div className="flex justify-between items-start">
          <div className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-400 font-mono tracking-tighter">VOLATILITY</div>
          <div className={`text-xs font-medium flex items-center ${vixData?.change >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {vixData?.change >= 0 ? '+' : ''}{vixData?.changePercent?.toFixed(2)}%
          </div>
        </div>
        <div>
          <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">INDIA VIX (^INDIAVIX)</h2>
          <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
            {vixData?.price?.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
          <span className="text-slate-400 mr-2">Sigma:</span> {iv.toFixed(4)} (INP_VAR)
        </div>
      </div>

      {/* Engine Status Card */}
      <div className="lg:col-span-3 bento-card bg-indigo-900/5 border-indigo-500/10 flex flex-col min-h-[160px]">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_indigo]"></div>
          <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Math Engine</h3>
        </div>
        <div className="space-y-2.5 flex-grow">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500 font-medium tracking-tight">Model</span>
            <span className="text-white font-bold tracking-tighter">BS_EURO_V1</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500 font-medium tracking-tight">Risk Free</span>
            <span className="text-white font-bold tracking-tighter">6.50%</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500 font-medium tracking-tight">Latency</span>
            <span className="text-indigo-400 font-bold font-mono tracking-tighter">~0.08ms</span>
          </div>
        </div>
      </div>

      {/* Cloud Proxy Status Card */}
      <div className="lg:col-span-3 bento-card flex flex-col justify-between min-h-[160px]">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Network Stream</h3>
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/50">
            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">Requests</div>
            <div className="text-lg font-black text-white tabular-nums leading-none">1.4k</div>
          </div>
          <div className="flex-1 bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/50">
            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">Uptime</div>
            <div className="text-lg font-black text-emerald-400 tabular-nums leading-none">100%</div>
          </div>
        </div>
        <div className="mt-3 text-[9px] font-mono text-indigo-400 bg-indigo-500/5 p-1.5 rounded border border-indigo-500/10 truncate font-semibold uppercase">
          SECURE_PROXY_ACTIVE: {vixData?.timestamp ? new Date(vixData.timestamp).toLocaleTimeString() : 'WAITING'}
        </div>
      </div>

      {/* Options Chain Table (Main Center Segment) */}
      <div className="lg:col-span-9 lg:row-span-2 bento-card p-0 overflow-hidden flex flex-col border-slate-800">
        <div className="bg-slate-800/20 p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
            <Activity className="w-3.5 h-3.5 mr-2 text-indigo-500" />
            Intraday Analysis <span className="text-slate-500 font-mono ml-3 text-[10px] tracking-widest uppercase">7D_EXP_PREDICTION</span>
          </h3>
          <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-md shadow-lg shadow-indigo-600/20 uppercase tracking-widest">Calls</button>
            <button className="px-3 py-1 text-slate-500 text-[9px] font-black uppercase tracking-widest">Puts</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono border-collapse">
            <thead className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 border-r border-slate-800/50">Delta</th>
                <th className="px-4 py-3 border-r border-slate-800/50">Theta</th>
                <th className="px-4 py-3 border-r border-slate-800/50">Vega</th>
                <th className="px-4 py-3 text-center bg-slate-800/50 text-indigo-400 border-x border-slate-800/50">Strike</th>
                <th className="px-4 py-3 text-right">Theor. Price</th>
                <th className="px-4 py-3 text-right">Gamma</th>
                <th className="px-4 py-3 text-right">IV%</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-bold tabular-nums">
              <AnimatePresence mode="popLayout">
                {chainData.map(({ strike, call }) => {
                  const isAtm = Math.abs(strike - underlyingPrice) < 25;
                  return (
                    <motion.tr 
                      key={strike}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border-b border-slate-800/50 hover:bg-indigo-500/5 transition-all duration-300 group ${isAtm ? 'bg-indigo-500/10' : ''}`}
                    >
                      <td className="px-4 py-2.5 text-emerald-400 group-hover:scale-105 transition-transform origin-left">{call.delta.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-rose-500 opacity-60">{call.theta.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-slate-400 opacity-50">{call.vega.toFixed(2)}</td>
                      <td className={`px-4 py-2.5 text-center font-black tracking-tighter border-x border-slate-800/30 ${isAtm ? 'bg-indigo-600 text-white shadow-[inset_0_0_20px_rgba(79,70,229,0.3)]' : 'bg-slate-800/20 text-slate-300'}`}>
                        {strike.toLocaleString()} {isAtm && <span className="ml-1 text-[8px] opacity-70 tracking-widest">ATM</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-white font-black">{call.price.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{call.gamma.toFixed(4)}</td>
                      <td className="px-4 py-2.5 text-right text-indigo-400">{(iv * 100).toFixed(1)}%</td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Greeks Visualizer / Intelligence Box */}
      <div className="lg:col-span-3 lg:row-span-2 bento-card flex flex-col border-slate-800 bg-slate-900/30">
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Sensitivities Analysis</h3>
        
        <div className="space-y-6 flex-grow">
          <VisualizerItem label="Delta Bias" value={75} color="bg-emerald-500" status="Bullish Bias" />
          <VisualizerItem label="Gamma Curve" value={92} color="bg-indigo-500" status="Max At ATM" />
          <VisualizerItem label="Theta Decay" value={45} color="bg-rose-500" status="Moderate" />
          <VisualizerItem label="Vega Shock" value={30} color="bg-amber-500" status="Low" />
        </div>

        <div className="mt-8">
          <div className="p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-600/10 blur-2xl group-hover:bg-indigo-600/20 transition-all"></div>
            <div className="text-[10px] text-indigo-400 font-bold uppercase mb-2 tracking-widest flex items-center">
              <Info className="w-3 h-3 mr-1.5" /> Intelligence
            </div>
            <p className="text-[11px] text-slate-400 leading-snug italic font-medium">
              &quot;Current Nifty VIX indicates a stable premium environment. Volatility skew suggests calls are favored as underlying momentum holds.&quot;
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

function VisualizerItem({ label, value, color, status }: { label: string, value: number, color: string, status: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold tracking-tight">
        <span className="text-slate-500">{label}</span>
        <span className={color.replace('bg-', 'text-')}>{status}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full ${color} shadow-[0_0_8px] ${color.replace('bg-', 'shadow-')}/30`}
        ></motion.div>
      </div>
    </div>
  );
}

