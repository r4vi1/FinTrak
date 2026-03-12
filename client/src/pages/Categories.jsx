import { useState } from "react";
import { Plus, Tag, Settings2, Trash2, X, PlusCircle, CheckCircle, AlertCircle } from "lucide-react";
import { useCategories } from "../hooks/useApi";
import { formatCurrency } from "../lib/utils";

const PRESET_COLORS = [
    "#a855f7", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6"
];

/* Skeleton card matching category card shape */
function CategorySkeleton() {
    return (
        <div className="surface-card p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-xl" />
                    <div className="space-y-2">
                        <div className="skeleton h-5 w-28 rounded-lg" />
                        <div className="skeleton h-3 w-16 rounded-lg" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 my-4 flex-1">
                <div className="skeleton h-16 rounded-xl" />
                <div className="skeleton h-16 rounded-xl" />
            </div>
            <div className="pt-4 border-t border-white/5">
                <div className="skeleton h-3 w-24 rounded-lg" />
            </div>
        </div>
    );
}

/* Styled inline confirm dialog */
function ConfirmDialog({ message, onConfirm, onCancel }) {
    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-3 mb-6">
                    <AlertCircle className="text-accent-rose shrink-0 mt-0.5" size={22} />
                    <div>
                        <h3 className="font-display font-bold text-lg mb-1">Are you sure?</h3>
                        <p className="text-zinc-400 text-sm">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-xl bg-accent-rose/20 border border-accent-rose/30 text-accent-rose text-sm font-bold hover:bg-accent-rose/30 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Categories() {
    const { data, isLoading, error, refetch } = useCategories();
    const categories = data?.categories || [];

    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }
    const [confirmDelete, setConfirmDelete] = useState(null); // category id to delete

    // Form State
    const [name, setName] = useState("");
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [rules, setRules] = useState([]); // { match_type: 'keyword', match_field: 'merchant', match_value: '' }

    const API_URL = "http://localhost:3001/api/categories";

    const addRule = () => {
        setRules([...rules, { match_type: 'keyword', match_field: 'merchant', match_value: '' }]);
    };

    const updateRule = (index, field, value) => {
        const newRules = [...rules];
        newRules[index][field] = value;
        setRules(newRules);
    };

    const removeRule = (index) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const showFeedback = (type, message) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Filter out empty rules
            const validRules = rules.filter(r => r.match_value.trim() !== "");

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color, icon: "tag", rules: validRules })
            });

            if (!response.ok) {
                const res = await response.json();
                throw new Error(res.error || "Failed to create category");
            }

            // Reset and refetch
            setName("");
            setColor(PRESET_COLORS[0]);
            setRules([]);
            setIsCreating(false);
            showFeedback('success', `Category "${name}" created${validRules.length > 0 ? ' and transactions auto-tagged' : ''}`);
            refetch();
        } catch (err) {
            showFeedback('error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
    const category = categories.find(c => c.id === id)
    if (category?.is_system) {
        showFeedback('error', "Cannot delete system category")
        setConfirmDelete(null)
        return
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" })
        if (response.ok) {
            showFeedback('success', 'Category deleted')
            refetch()
        } else {
            const res = await response.json()
            showFeedback('error', res.error)
        }
    } catch (err) {
        showFeedback('error', err.message)
    }
    setConfirmDelete(null)
}

    return (
        <div className="animate-in pt-6 pb-12 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-5xl font-display font-bold tracking-tighter text-edge">CATEGORIES</h1>
                    <p className="text-zinc-500 font-medium tracking-wide mt-2">Manage custom tags & auto-categorization rules</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn-accent flex items-center gap-2 self-start"
                    >
                        <Plus size={18} /> New Category
                    </button>
                )}
            </div>

            {/* Inline Feedback Toast */}
            {feedback && (
                <div className={`mb-6 ${feedback.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {feedback.message}
                </div>
            )}

            {/* Creation Form (Inline) */}
            {isCreating && (
                <div className="surface-card p-6 md:p-8 rounded-2xl mb-8 border border-accent-lime/20 relative" style={{ animation: 'scalePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                        <Tag className="text-accent-lime" /> Create Category
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Late Night Swiggy"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-lime transition-colors font-display text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Color Theme</label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-200 ${color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Rules Engine */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                                        <Settings2 size={16} /> Auto-Categorization Rules
                                    </label>
                                    <p className="text-xs text-zinc-500 mt-1">Transactions matching these rules will be tagged automatically.</p>
                                </div>
                                <button type="button" onClick={addRule} className="text-accent-cyan hover:text-accent-cyan/80 text-sm font-bold flex items-center gap-1 transition-colors">
                                    <PlusCircle size={16} /> Add Rule
                                </button>
                            </div>

                            {rules.length === 0 ? (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-zinc-500 text-sm">
                                    No rules added. This category must be applied manually.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {rules.map((rule, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center bg-zinc-900/50 p-2 md:p-3 rounded-xl border border-white/5 relative group stagger-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <span className="font-bold text-zinc-500 w-6 text-center hidden sm:block">IF</span>

                                            <select
                                                value={rule.match_field}
                                                onChange={(e) => updateRule(idx, 'match_field', e.target.value)}
                                                className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-accent-cyan outline-none w-full sm:w-auto"
                                            >
                                                <option value="merchant">Merchant Name</option>
                                                <option value="description">Description (Notes)</option>
                                            </select>

                                            <select
                                                value={rule.match_type}
                                                onChange={(e) => updateRule(idx, 'match_type', e.target.value)}
                                                className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-accent-cyan outline-none w-full sm:w-auto"
                                            >
                                                <option value="keyword">Contains Word</option>
                                                <option value="regex">Matches Regex</option>
                                                <option value="exact">Exact Match</option>
                                            </select>

                                            <input
                                                type="text"
                                                required
                                                placeholder={rule.match_type === 'regex' ? 'e.g., ^Uber.*Drive$' : 'e.g., swiggy'}
                                                value={rule.match_value}
                                                onChange={(e) => updateRule(idx, 'match_value', e.target.value)}
                                                className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-accent-cyan outline-none w-full"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => removeRule(idx)}
                                                className="absolute -right-2 -top-2 sm:static sm:right-auto sm:top-auto text-zinc-600 hover:text-accent-rose bg-[#0a0a0a] sm:bg-transparent rounded-full p-1 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={submitting} className="btn-accent px-8">
                                {submitting ? "Saving & Tagging..." : "Create Category"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Category List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <CategorySkeleton key={i} />)}
                </div>
            ) : error ? (
                <div className="text-center py-12 text-accent-rose font-medium">Failed to load categories: {error}</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 font-medium surface-card rounded-2xl">No custom categories found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat, idx) => (
                        <div key={cat.id} className={`surface-card p-6 flex flex-col hover:border-white/10 transition-colors group stagger-in stagger-in-${Math.min(idx + 1, 8)}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-lg">{cat.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                                            <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">{cat.is_system ? 'System' : 'Custom'}</p>
                                        </div>
                                    </div>
                                </div>
                                {!cat.is_system && (
                                    <button
                                        onClick={() => setConfirmDelete(cat.id)}
                                        className="text-zinc-600 hover:text-accent-rose opacity-0 group-hover:opacity-100 transition-all p-1"
                                        title="Delete Category"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 my-4 flex-1">
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Total Spent</p>
                                    <p className="font-display font-bold">{formatCurrency(cat.stats?.total_debit || 0)}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Transactions</p>
                                    <p className="font-display font-bold">{cat.stats?.transaction_count || 0}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                                <Settings2 size={14} className="text-zinc-500" />
                                <span className="text-xs text-zinc-400 font-medium">
                                    {cat.rules?.length || 0} active {cat.rules?.length === 1 ? 'rule' : 'rules'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm Delete Dialog */}
            {confirmDelete && (
                <ConfirmDialog
                    message={`This will remove the category "${categories.find(c => c.id === confirmDelete)?.name}" and uncategorize all associated transactions.`}
                    onConfirm={() => handleDelete(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
}
