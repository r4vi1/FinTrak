import { useCategorySpend } from '../../hooks/useApi';
import { formatCurrency } from '../../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function CategoryWidget() {
    const { data, isLoading, error } = useCategorySpend();

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data || !data.spending || data.spending.length === 0) {
        return <div className="text-zinc-500 text-sm flex h-full items-center justify-center">No category data</div>;
    }

    // Take top 5 categories + 'Other'
    let chartData = data.spending.slice(0, 5);
    const otherTotal = data.spending.slice(5).reduce((sum, cat) => sum + cat.total, 0);

    if (otherTotal > 0) {
        chartData.push({
            name: 'Other',
            total: otherTotal,
            color: '#3f3f46' // zinc-700
        });
    }

    const customTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-elevated border border-white/10 p-3 rounded-lg shadow-xl">
                    <p className="font-display font-medium text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                        {data.name}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">{formatCurrency(data.total)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full flex items-center justify-between">
            {/* Legend Map */}
            <div className="flex-1 space-y-4 pr-4">
                {chartData.slice(0, 4).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}40` }}
                            />
                            <span className="text-sm font-medium text-zinc-300 truncate max-w-[100px]" title={entry.name}>
                                {entry.name}
                            </span>
                        </div>
                        <span className="font-display text-sm font-bold text-white">
                            {formatCurrency(entry.total)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Donut Chart */}
            <div className="w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="total"
                            stroke="none"
                            cornerRadius={4}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={customTooltip} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
