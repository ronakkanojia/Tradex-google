/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import OptionsChain from './components/OptionsChain';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-sans p-6 overflow-x-hidden flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header Section */}
      <header className="flex items-center justify-between mb-8 px-2 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white text-xl">TX</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Tradex <span className="text-indigo-500 font-medium text-sm ml-1 tracking-wide">PRO</span></h1>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Terminal v2.4.0</span>
          </div>
        </div>
        <div className="flex items-center space-x-8">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Market Status</span>
            <span className="text-emerald-400 text-xs flex items-center font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>Live Data
            </span>
          </div>
          <div className="hidden md:block w-px h-10 bg-slate-800"></div>
          <div className="hidden md:block text-right">
            <div className="text-xs text-slate-400 font-medium tracking-tight">Session: <span className="text-white ml-1">09:15 - 15:30</span></div>
            <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">Firebase Edge Node (Mumbai)</div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full flex-grow">
        <OptionsChain />
      </main>

      <footer className="max-w-[1600px] mx-auto w-full border-t border-slate-900 py-8 mt-12 flex justify-between items-center text-[10px] font-mono text-slate-600 uppercase tracking-widest">
        <div>&copy; {new Date().getFullYear()} Tradex Engine &bull; System Nominal</div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center"><span className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></span>Black-Scholes (Euro)</span>
          <span className="flex items-center"><span className="w-1 h-1 bg-emerald-500 rounded-full mr-2"></span>Yahoo Finance API</span>
        </div>
      </footer>
    </div>
  );
}


