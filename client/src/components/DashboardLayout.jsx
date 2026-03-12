import { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import { useNetWorth, useActiveRuleStats, useTopMerchants } from "../hooks/useApi";
import { useCountUp } from "../hooks/useCountUp";
import CashflowWidget from "./widgets/CashflowWidget";
import CategoryWidget from "./widgets/CategoryWidget";
import TransactionsWidget from "./widgets/TransactionsWidget";
import AccountsWidget from "./widgets/AccountsWidget";
import { formatCurrency } from "../lib/utils";

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Default layout coordinates
const DEFAULT_LAYOUT = [
    { i: "cashflow", x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
    { i: "transactions", x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "categories", x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "accounts", x: 4, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "stats", x: 8, y: 4, w: 4, h: 2, minW: 2, minH: 2 },
    { i: "largest", x: 8, y: 6, w: 4, h: 2, minW: 2, minH: 2 },
];

export default function DashboardLayout() {
    const { data: netWorthData, isLoading: nwLoading } = useNetWorth();
    const { data: statsData } = useActiveRuleStats();
    const { data: topMerchantsData } = useTopMerchants(1);

    const animatedNetWorth = useCountUp(netWorthData?.net_worth, 1500);

    const [mounted, setMounted] = useState(false);
const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem("fintrak_dashboard_layout_v2");
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return {
                lg: DEFAULT_LAYOUT,
                sm: DEFAULT_LAYOUT,
                xs: DEFAULT_LAYOUT
            };
        }
    }
    return {
  lg: DEFAULT_LAYOUT,
  sm: DEFAULT_LAYOUT,
  xs: DEFAULT_LAYOUT
};
});
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLayoutChange = (currentLayout, allLayouts) => {
        setLayouts(allLayouts);
        localStorage.setItem("fintrak_dashboard_layout_v2", JSON.stringify(allLayouts));
    };

    const totalRules = statsData?.categories ? statsData.categories.reduce((acc, cat) => acc + cat.rules.length, 0) : 0;
    const autoTagsCount = statsData?.categories ? statsData.categories.reduce((acc, cat) => acc + cat.stats.transaction_count, 0) : 0;
    const largestOutflow = topMerchantsData?.merchants?.[0];

    return (
        <div className="animate-in pt-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 relative gap-6">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-hero-glow -z-10 rounded-full blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/2" />

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                        <div className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
                        <span className="text-xs font-display font-semibold tracking-widest uppercase text-zinc-300">Live Sync</span>
                    </div>
                    <div>
                        <h1 className="text-[72px] lg:text-[80px] leading-none font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                            {nwLoading ? "Loading…" : formatCurrency(animatedNetWorth).slice(0, -3)}
                            {!nwLoading && <span className="text-4xl text-zinc-600">.00</span>}
                        </h1>
                        <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm mt-3 flex items-center gap-2">
                            Net Wealth
                            <span className="text-accent-cyan font-bold">+12.4%</span>
                        </p>
                    </div>
                </div>

                <div className="flex self-start lg:self-end">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`btn-accent group transition-transform ${isEditMode ? 'bg-accent-rose shadow-none text-white' : ''}`}
                        style={isEditMode ? { background: 'var(--accent-rose)', color: 'white', boxShadow: 'none' } : {}}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isEditMode ? "Lock Grid" : "Edit Layout"}
                        </span>
                    </button>
                </div>
            </div>

            <div className="relative z-10 -mx-4 overflow-visible">
                {mounted && (
                    <ResponsiveGridLayout
                        className={`layout ${isEditMode ? 'grid-editing' : ''}`}
                        layouts={layouts}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={80}
                        onLayoutChange={handleLayoutChange}
                        isDraggable={isEditMode}
                        isResizable={isEditMode}
                        margin={[24, 24]}
                        useCSSTransforms={true}
                    >
                        {/* Main Chart */}
                        <div key="cashflow" className="surface-card p-6 pattern-dots h-full hover:border-zinc-700 flex flex-col">
                            <h3 className="font-display text-xl font-bold tracking-tight mb-1">
                                Cash Velocity
                                <span className="text-zinc-500 text-base font-medium ml-2">6 months</span>
                            </h3>
                            <div className="flex-1 min-h-0">
                                <CashflowWidget />
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div key="transactions" className="surface-card p-6 h-full flex flex-col">
                            <h3 className="font-display text-xl font-bold tracking-tight mb-4">Recent Outflows</h3>
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <TransactionsWidget />
                            </div>
                        </div>

                        {/* Category Spend Donut */}
                        <div key="categories" className="surface-card p-6 h-full flex flex-col">
                            <h3 className="font-display text-xl font-bold tracking-tight mb-4">Current Month Spends</h3>
                            <div className="flex-1 min-h-0">
                                <CategoryWidget />
                            </div>
                        </div>

                        {/* Accounts Overview */}
                        <div key="accounts" className="surface-card p-6 h-full flex flex-col">
                            <h3 className="font-display text-xl font-bold tracking-tight mb-4">Linked Accounts</h3>
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <AccountsWidget />
                            </div>
                        </div>

                        {/* Category Engine Stats */}
                        <div key="stats" className="surface-card p-6 pattern-grid flex flex-col justify-center h-full">
                            <h3 className="font-display text-lg font-bold tracking-tight mb-2 text-zinc-400">Active Rule Engine</h3>
                            <div>
                                <p className="text-4xl font-display font-bold text-accent-cyan">
                                    {autoTagsCount} <span className="text-base text-zinc-500">tags</span>
                                </p>
                            </div>
                        </div>

                        {/* Largest Merchant Stats */}
                        <div key="largest" className="surface-card p-6 bg-gradient-to-br from-surface to-elevated flex flex-col justify-center h-full">
                            <h3 className="font-display text-lg font-bold tracking-tight mb-2 text-zinc-400">Largest Outflow</h3>
                            {largestOutflow ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                                        <span className="text-black font-display font-bold text-xl">{largestOutflow.merchant.charAt(0)}</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-display text-lg font-bold truncate">{largestOutflow.merchant}</p>
                                        <p className="text-accent-rose font-medium text-sm mt-0.5 whitespace-nowrap">
                                            -{formatCurrency(largestOutflow.total)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-zinc-500">Loading...</p>
                            )}
                        </div>
                    </ResponsiveGridLayout>
                )}
            </div>
        </div>
    );
}
