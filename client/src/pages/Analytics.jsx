import { useState, useMemo } from "react";
import { useCashflow, useCategorySpend, useRecurring, useTopMerchants } from "../hooks/useApi";
import { formatCurrency } from "../lib/utils";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCcw, ShoppingBag } from "lucide-react";
import { format, parseISO } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0a0a0a] border border-white/10 p-3 rounded-xl shadow-xl">
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex flex-col mb-1">
                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{entry.name}</span>
                        <span className="font-display font-bold text-white text-lg" style={{ color: entry.color }}>
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function Analytics() {
    const [timeframe, setTimeframe] = useState("6m"); // 6m, 1y

    // Fetch data via hooks
    const { data: cashflowData, isLoading: cashflowLoading } = useCashflow(timeframe === '6m' ? 6 : 12);
    const { data: categoryData, isLoading: categoryLoading } = useCategorySpend(); // Using default current month for now, can be expanded
    const { data: topMerchantsData, isLoading: merchantsLoading } = useTopMerchants(5);
    const { data: recurringData, isLoading: recurringLoading } = useRecurring();

    const cashflow = cashflowData?.cashflow || [];
    const spending = categoryData?.spending || [];
    const topMerchants = topMerchantsData?.merchants || [];
    const recurring = recurringData?.recurring || [];

    // Process Cashflow Data
    const formattedCashflow = useMemo(() => {
        return cashflow.map(d => ({
            ...d,
            formattedMonth: format(parseISO(`${d.month}-01`), 'MMM yy'),
        })).reverse(); // Oldest to newest for charts
    }, [cashflow]);

    // Process Category Data for Pie Chart (group small categories into 'Other')
    const formattedCategories = useMemo(() => {
        if (!spending.length) return [];
        let sorted = [...spending].sort((a, b) => b.total - a.total);
        if (sorted.length > 5) {
            const top5 = sorted.slice(0, 5);
            const otherTotal = sorted.slice(5).reduce((sum, item) => sum + item.total, 0);
            return [...top5, { name: 'Other Categories', total: otherTotal, color: '#3f3f46' }]; // zinc-700
        }
        return sorted;
    }, [spending]);

    return (
        <div className="animate-in pt-6 pb-12">
            <h1 className="text-5xl font-display font-bold tracking-tighter mb-2 text-edge">INSIGHTS</h1>
            <p className="text-zinc-500 font-medium tracking-wide mb-8">Deep dive into your financial velocity and trends.</p>

            {/* Top row: Velocity metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 6 Month Averages */}
                <div className="surface-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-lime/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-accent-lime/20 transition-all duration-500" />
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                        <TrendingUp size={20} className="text-accent-lime" />
                        <span className="font-bold text-xs uppercase tracking-widest">Avg Monthly Outflow</span>
                    </div>
                    {cashflowLoading ? (
                        <div className="h-10 bg-white/5 animate-pulse rounded w-1/2"></div>
                    ) : (
                        <>
                            <p className="text-4xl font-display font-bold text-white mb-2">
                                {formatCurrency(cashflow.reduce((sum, item) => sum + item.outflow, 0) / (cashflow.length || 1))}
                            </p>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">OVER THE LAST {timeframe.toUpperCase()}</p>
                        </>
                    )}
                </div>

                <div className="surface-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-accent-cyan/20 transition-all duration-500" />
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                        <ArrowDownRight size={20} className="text-accent-cyan" />
                        <span className="font-bold text-xs uppercase tracking-widest">Avg Monthly Inflow</span>
                    </div>
                    {cashflowLoading ? (
                        <div className="h-10 bg-white/5 animate-pulse rounded w-1/2"></div>
                    ) : (
                        <>
                            <p className="text-4xl font-display font-bold text-white mb-2">
                                {formatCurrency(cashflow.reduce((sum, item) => sum + item.inflow, 0) / (cashflow.length || 1))}
                            </p>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">OVER THE LAST {timeframe.toUpperCase()}</p>
                        </>
                    )}
                </div>

                <div className="surface-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-rose/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-accent-rose/20 transition-all duration-500" />
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                        <RefreshCcw size={20} className="text-accent-rose" />
                        <span className="font-bold text-xs uppercase tracking-widest">Fixed Recurring (Est)</span>
                    </div>
                    {recurringLoading ? (
                        <div className="h-10 bg-white/5 animate-pulse rounded w-1/2"></div>
                    ) : (
                        <>
                            <p className="text-4xl font-display font-bold text-white mb-2">
                                {formatCurrency(recurring.reduce((sum, item) => sum + item.avg_monthly, 0))}
                            </p>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">MONTHLY SUBSCIPTIONS / BILLS</p>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cashflow Trend (Spans 2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="surface-card p-6 md:p-8 rounded-3xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                                    <TrendingUp className="text-accent-cyan" size={24} /> Cashflow Velocity
                                </h3>
                                <p className="text-zinc-500 text-sm mt-1">Inflow vs Outflow over time</p>
                            </div>
                            <div className="flex bg-black rounded-lg p-1 border border-white/5">
                                <button
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-widest transition-colors ${timeframe === '6m' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    onClick={() => setTimeframe('6m')}
                                >
                                    6M
                                </button>
                                <button
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-widest transition-colors ${timeframe === '12m' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                                    onClick={() => setTimeframe('12m')}
                                >
                                    1Y
                                </button>
                            </div>
                        </div>

                        {cashflowLoading ? (
                            <div className="h-[300px] flex items-center justify-center text-zinc-500 animate-pulse">Loading cashflow data...</div>
                        ) : (
                            <div className="h-[300px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={formattedCashflow} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#d4ff00" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#d4ff00" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="formattedMonth"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="inflow"
                                            name="Inflow"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorInflow)"
                                            activeDot={{ r: 6, fill: "#06b6d4", stroke: "#000", strokeWidth: 2 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="outflow"
                                            name="Outflow"
                                            stroke="#d4ff00"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorOutflow)"
                                            activeDot={{ r: 6, fill: "#d4ff00", stroke: "#000", strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-0" />
                    </div>

                    {/* Top Merchants List */}
                    <div className="surface-card p-6 md:p-8 rounded-3xl relative">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                                    <ShoppingBag className="text-accent-rose" size={24} /> Top Outflows
                                </h3>
                                <p className="text-zinc-500 text-sm mt-1">Merchants dominating your spending</p>
                            </div>
                        </div>

                        {merchantsLoading ? (
                            <div className="py-12 text-center text-zinc-500 animate-pulse">Loading merchant data...</div>
                        ) : (
                            <div className="space-y-4">
                                {topMerchants.map((merchant, idx) => {
                                    // Calculate relative width for the bar (max is first item naturally)
                                    const maxTotal = topMerchants[0]?.total || 1;
                                    const widthPercent = Math.max(5, (merchant.total / maxTotal) * 100);

                                    return (
                                        <div key={idx} className="relative group">
                                            {/* Background Tracker Bar */}
                                            <div className="absolute inset-0 bg-white/5 rounded-xl overflow-hidden">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-accent-rose/10 transition-all duration-1000 ease-out"
                                                    style={{ width: `${widthPercent}%` }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="relative p-4 flex items-center justify-between z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded bg-black border border-white/5 flex items-center justify-center font-display font-bold text-accent-rose">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white group-hover:text-accent-rose transition-colors">{merchant.merchant}</p>
                                                        <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase">{merchant.count} Transactions</p>
                                                    </div>
                                                </div>
                                                <p className="font-display font-bold text-lg">{formatCurrency(merchant.total)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Category Breakdown + Recurring List) */}
                <div className="space-y-8">
                    {/* Category Pie Chart */}
                    <div className="surface-card p-6 rounded-3xl mix-blend-luminosity hover:mix-blend-normal transition-all duration-500">
                        <div className="mb-6">
                            <h3 className="text-lg font-display font-bold">Category Deep Dive</h3>
                            <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-bold">Current Month</p>
                        </div>

                        {categoryLoading ? (
                            <div className="h-[250px] flex items-center justify-center text-zinc-500 animate-pulse">Loading categories...</div>
                        ) : (
                            <>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={formattedCategories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="total"
                                                stroke="none"
                                            >
                                                {formattedCategories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-lg outline-none" style={{ filter: `drop-shadow(0 0 8px ${entry.color}40)` }} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3 mt-4">
                                    {formattedCategories.map((cat, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }}></span>
                                                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{cat.name}</span>
                                            </div>
                                            <span className="font-display font-bold">{formatCurrency(cat.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Recurring Subscriptions Box */}
                    <div className="bg-black/40 border border-[#22c55e]/20 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent opacity-20" />

                        <div className="mb-6">
                            <h3 className="text-lg font-display font-bold flex items-center gap-2">
                                <RefreshCcw className="text-[#22c55e]" size={18} /> Fixed Expenses
                            </h3>
                            <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-bold">Detected Subscriptions</p>
                        </div>

                        {recurringLoading ? (
                            <div className="py-6 text-center text-zinc-500 animate-pulse">Scanning subscriptions...</div>
                        ) : recurring.length === 0 ? (
                            <div className="py-6 text-center text-zinc-500 text-sm">No recurring expenses detected yet.</div>
                        ) : (
                            <div className="space-y-4">
                                {recurring.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b last:border-0 border-white/5 pb-3">
                                        <div>
                                            <p className="font-bold text-sm text-zinc-200">{item.merchant}</p>
                                            <p className="text-[10px] text-[#22c55e] uppercase tracking-widest font-bold mt-0.5">Auto-Renewing</p>
                                        </div>
                                        <p className="font-display font-bold">{formatCurrency(item.avg_monthly)}<span className="text-zinc-500 text-xs font-sans">/mo</span></p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
