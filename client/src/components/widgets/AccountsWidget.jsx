import { useAccounts } from "../../hooks/useApi";
import { formatCurrency } from "../../lib/utils";

export default function AccountsWidget() {
    const { data, isLoading, error } = useAccounts();

    if (isLoading) return <div className="animate-pulse h-full bg-white/5 rounded-lg"></div>;
    if (error) return <div className="text-accent-rose text-sm">Failed to load accounts</div>;

    const accounts = data?.accounts || [];

    return (
        <div className="space-y-3 overflow-y-auto h-full pr-1">
            {accounts.map(acc => (
                <div key={acc.id} className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                    <div>
                        <p className="font-display font-semibold text-[15px]">{acc.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                            {acc.institution} {acc.type && `• ${acc.type}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-display font-bold text-[#d4ff00]">
                            {formatCurrency(acc.balance)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
