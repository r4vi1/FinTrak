import { useRecentTransactions } from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

export default function TransactionsWidget() {
    const { data, isLoading, error } = useRecentTransactions(6);

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return <div className="text-accent-rose text-sm">Failed to load transactions</div>;
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-2">
                {data.transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">

                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'credit' ? 'bg-accent-lime/10 text-accent-lime' : 'bg-zinc-800 text-zinc-400'}`}>
                                {txn.type === 'credit' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                            </div>

                            <div>
                                <p className="font-display font-bold text-[15px] group-hover:text-white transition-colors">{txn.merchant}</p>
                                <p className="text-xs text-zinc-500 font-medium">{formatDate(txn.date)} • {txn.account?.name || 'Unknown'}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className={`font-display font-bold ${txn.type === 'credit' ? 'text-accent-lime' : 'text-white'}`}>
                                {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                            </p>

                            {/* Top Tag indicator */}
                            {txn.categories && txn.categories.length > 0 && (
                                <div className="flex items-center justify-end gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <div
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: txn.categories[0].color }}
                                    />
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                                        {txn.categories[0].name}
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
