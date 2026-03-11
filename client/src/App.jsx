import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import DashboardLayout from "./components/DashboardLayout";

import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Analytics from "./pages/Analytics";

const Accounts = () => (
  <div className="animate-in pt-8">
    <h1 className="text-5xl font-display font-bold tracking-tighter mb-4 text-edge">ACCOUNTS</h1>
  </div>
);

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-layout relative overflow-hidden bg-background">

        {/* Global Light Leaks */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-rose/[0.03] blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-accent-cyan/[0.04] blur-[120px] pointer-events-none" />

        {/* Global Base Texture (Grid) */}
        <div className="fixed inset-0 pointer-events-none z-[-1] pattern-grid opacity-30" />

        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* Main content gracefully handles the sibling's width changes */}
        <main className={`flex-1 w-full transition-all duration-400 ease-in-out ${isCollapsed ? 'pl-[88px]' : 'pl-[280px]'}`}>
          <div className="max-w-[1400px] mx-auto p-8 lg:p-12 relative z-10">
            <Routes>
              <Route path="/" element={<DashboardLayout />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/categories" element={<Categories />} />
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
