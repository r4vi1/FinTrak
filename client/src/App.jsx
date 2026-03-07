import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// Temporary placeholder pages showing modern layout
const Dashboard = () => (
  <div className="animate-in pt-6">
    <div className="flex items-end justify-between mb-16 relative">
      {/* Abstract Background Element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-hero-glow -z-10 rounded-full blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/2" />

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
          <span className="text-xs font-display font-semibold tracking-widest uppercase text-zinc-300">Live Sync</span>
        </div>
        <div>
          <h1 className="text-[80px] leading-none font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
            ₹4,62,281<span className="text-4xl text-zinc-600">.00</span>
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm mt-3 flex items-center gap-2">
            Net Wealth
            <span className="text-accent-cyan font-bold">+12.4%</span>
          </p>
        </div>
      </div>

      <button className="btn-accent group">
        <span className="relative z-10 flex items-center gap-2">
          Analyse Portfolio
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transform group-hover:translate-x-1 transition-transform">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>

    <div className="grid grid-cols-12 gap-6 relative z-10">
      <div className="surface-card col-span-8 p-8 min-h-[400px] pattern-dots flex flex-col justify-between group">
        <div className="flex justify-between items-start">
          <h3 className="font-display text-xl font-bold tracking-tight">Cash Velocity</h3>
          <select className="bg-transparent border border-white/10 rounded-lg px-3 py-1 text-sm font-medium text-zinc-400 focus:outline-none focus:border-accent-lime">
            <option>Last 6 Months</option>
            <option>This Year</option>
          </select>
        </div>
        <div className="w-full h-full flex items-center justify-center text-zinc-700 font-display font-bold text-4xl mt-8 transition-colors group-hover:text-zinc-600">
          [ CHART AREA ]
        </div>
      </div>

      <div className="col-span-4 space-y-6">
        <div className="surface-card p-6 min-h-[190px] bg-gradient-to-br from-surface to-elevated">
          <h3 className="font-display text-lg font-bold tracking-tight mb-4 text-zinc-400">Largest Outflow</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
              <span className="text-black font-display font-bold text-xl">A</span>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">Amazon</p>
              <p className="text-accent-rose font-medium text-sm flex items-center gap-1">
                -₹2,13,826
              </p>
            </div>
          </div>
        </div>

        <div className="surface-card p-6 min-h-[186px] pattern-grid">
          <h3 className="font-display text-lg font-bold tracking-tight mb-4 text-zinc-400">Active Rule Engine</h3>
          <p className="text-4xl font-display font-bold">519<span className="text-lg text-zinc-500 ml-2">tags</span></p>
          <p className="text-sm text-accent-cyan mt-2">Across 12 Categories</p>
        </div>
      </div>
    </div>
  </div>
);

const Transactions = () => (
  <div className="animate-in pt-8">
    <h1 className="text-5xl font-display font-bold tracking-tighter mb-4 text-edge">TRANSACTIONS</h1>
  </div>
);

const Analytics = () => (
  <div className="animate-in pt-8">
    <h1 className="text-5xl font-display font-bold tracking-tighter mb-4 text-edge">INSIGHTS</h1>
  </div>
);

const Accounts = () => (
  <div className="animate-in pt-8">
    <h1 className="text-5xl font-display font-bold tracking-tighter mb-4 text-edge">ACCOUNTS</h1>
  </div>
);

function App() {
  // Listen for sidebar toggle events to adjust main margin
  const [sidebarWidth, setSidebarWidth] = useState(280);

  // We'll set a global observer or listen to DOM changes in a real app,
  // but for the shell we'll just apply a generic wrapper class
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        {/* Main content gracefully handles the sibling's width changes */}
        <main className="flex-1 w-full pl-[88px] lg:pl-[280px] transition-all duration-400 ease-in-out">
          <div className="max-w-[1400px] mx-auto p-8 lg:p-12">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/accounts" element={<Accounts />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
