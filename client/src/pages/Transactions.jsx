import { useState, useMemo, useEffect } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Search, Filter, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";
import { useTransactions, useAccounts, useCategories } from "../hooks/useApi";
import { formatCurrency } from "../lib/utils";

/* Skeleton row matching transaction card shape */
function TransactionSkeleton() {
    return (
        <div className="surface-card p-4 rounded-xl flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-2/5 rounded-lg" />
                <div className="skeleton h-3 w-3/5 rounded-lg" />
            </div>
            <div className="skeleton h-6 w-20 rounded-lg" />
        </div>
    );
}

export default function Transactions() {
    // Filters state
    const [search, setSearch] = useState("");
    const [accountId, setAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [type, setType] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Debounced search
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch data
    const { data: txData, isLoading: txLoading } = useTransactions({
        search, account_id: accountId, category_id: categoryId, type, date_from: dateFrom, date_to: dateTo, limit: 100
    });
    const { data: accData } = useAccounts();
    const { data: catData } = useCategories();

    const accounts = accData?.accounts || [];
    const categories = catData?.categories || [];
    const transactions = txData?.transactions || [];

    // Group transactions by date
    const groupedTransactions = useMemo(() => {
        const groups = {};
        transactions.forEach(tx => {
            const dateStr = tx.date;
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(tx);
        });

        // Convert to sorted array
        return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [transactions]);

    const getDateHeader = (dateStr) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        return format(date, "EEEE, MMMM do, yyyy");
    };

    return (
        <div className="animate-in pt-6 pb-12">
            <h1 className="text-5xl font-display font-bold tracking-tighter mb-8 text-edge">TRANSACTIONS</h1>

            {/* Filter Bar */}
            <div className="surface-card p-4 rounded-2xl mb-8 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search merchants, descriptions..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-accent-cyan transition-colors"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
                    <select
                        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-accent-lime font-medium appearance-none min-w-[140px]"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                    >
                        <option value="">All Accounts</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.institution})</option>
                        ))}
                    </select>

                    <select
                        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-accent-lime font-medium appearance-none min-w-[140px]"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-accent-lime font-medium appearance-none min-w-[120px]"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="debit">Outflows</option>
                        <option value="credit">Inflows</option>
                    </select>

                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium"
                        onClick={() => {
                            setSearch(""); setSearchInput(""); setAccountId(""); setCategoryId(""); setType(""); setDateFrom(""); setDateTo("");
                        }}
                    >
                        <Filter size={16} /> Clear
                    </button>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-8">
                {txLoading ? (
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => <TransactionSkeleton key={i} />)}
                    </div>
                ) : groupedTransactions.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 font-medium surface-card rounded-2xl">No transactions found for these filters.</div>
                ) : (
                    groupedTransactions.map(([date, dayTxns]) => (
                        <div key={date}>
                            <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur pb-2 pt-2 z-10 border-b border-white/5">
                                {getDateHeader(date)}
                            </h3>
                            <div className="space-y-3">
                                {dayTxns.map((tx, txIdx) => {
                                    const isCredit = tx.type === 'credit';
                                    return (
                                        <div key={tx.id} className={`surface-card p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors group cursor-pointer stagger-in stagger-in-${Math.min(txIdx + 1, 8)}`}>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isCredit ? 'bg-accent-lime/10 text-accent-lime' : 'bg-white/5 text-zinc-400'}`}>
                                                {isCredit ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                                                    <p className="font-display font-bold text-lg truncate group-hover:text-accent-cyan transition-colors">{tx.merchant}</p>
                                                    <p className={`font-display font-bold text-xl whitespace-nowrap ${isCredit ? 'text-accent-lime' : 'text-white'}`}>
                                                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                                    {tx.account && (
                                                        <div className="flex items-center gap-1.5 opacity-70">
                                                            <div className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-[8px] font-bold">
                                                                {tx.account.institution.charAt(0)}
                                                            </div>
                                                            <span className="text-xs uppercase tracking-wider font-semibold">{tx.account.name}</span>
                                                        </div>
                                                    )}

                                                    {tx.categories && tx.categories.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {tx.categories.map(cat => (
                                                                <span key={cat.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-white/10 text-zinc-300 border border-white/5">
                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                                                                    {cat.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-accent-rose/10 text-accent-rose border border-accent-rose/20">
                                                            <Tag size={10} /> Uncategorized
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
