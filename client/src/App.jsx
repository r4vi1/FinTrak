import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// Temporary placeholder pages showing off typography
const Dashboard = () => (
  <div className="animate-in pt-8">
    <div className="flex items-end justify-between mb-12">
      <div>
        <p className="text-zinc-400 font-medium tracking-widest uppercase text-sm mb-2">Total Net Worth</p>
        <h1 className="text-6xl font-display font-bold tracking-tighter">₹4,62,281</h1>
      </div>
      <button className="btn-accent">
        Analyse Portfolio
      </button>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <div className="surface-card p-6 h-64">
        <p className="text-zinc-400 text-sm font-medium">Monthly Cashflow</p>
      </div>
      <div className="surface-card p-6 h-64">
        <p className="text-zinc-400 text-sm font-medium">Top Category</p>
      </div>
      <div className="surface-card p-6 h-64">
        <p className="text-zinc-400 text-sm font-medium">Recent Activity</p>
      </div>
    </div>
  </div>
);

const Transactions = () => (
  <div className="animate-in pt-8">
    <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Transactions</h1>
    <p className="text-zinc-400">All your history categorized by our engine.</p>
  </div>
);

const Analytics = () => (
  <div className="animate-in pt-8">
    <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Insights</h1>
    <p className="text-zinc-400">Deep dive into your spending velocity.</p>
  </div>
);

const Accounts = () => (
  <div className="animate-in pt-8">
    <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Linked Accounts</h1>
    <p className="text-zinc-400">Manage your connected bank and credit data.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/accounts" element={<Accounts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
