import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCashflow } from '../../hooks/useApi';
import { formatCurrency } from '../../lib/utils';
import { format, parseISO } from 'date-fns';

export default function CashflowWidget() {
    const { data, isLoading, error } = useCashflow(6);

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent-lime border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return <div className="text-accent-rose text-sm">Failed to load cashflow data</div>;
    }

    // Format data for Recharts
    const chartData = [...data.cashflow].reverse().map(item => ({
        name: format(parseISO(`${item.month}-01`), 'MMM'),
        Inflow: item.inflow,
        Outflow: item.outflow,
        Net: item.net
    }));

    const customTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-elevated border border-white/10 p-3 rounded-lg shadow-xl outline-none">
                    <p className="font-display font-bold text-white mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[calc(100%-40px)] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4ff00" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#d4ff00" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff2a5f" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ff2a5f" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                    />
                    <YAxis
                        stroke="#52525b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={customTooltip} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    <Area
                        type="monotone"
                        dataKey="Inflow"
                        stroke="#d4ff00"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorInflow)"
                    />
                    <Area
                        type="monotone"
                        dataKey="Outflow"
                        stroke="#ff2a5f"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorOutflow)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
