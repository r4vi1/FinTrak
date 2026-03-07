import { NavLink } from "react-router-dom";
import { LayoutDashboard, WalletCards, Activity, Layers, LogOut } from "lucide-react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
    { path: "/", icon: LayoutDashboard, label: "Overview" },
    { path: "/transactions", icon: WalletCards, label: "Transactions" },
    { path: "/analytics", icon: Activity, label: "Insights" },
    { path: "/accounts", icon: Layers, label: "Linked Accounts" },
];

export default function Sidebar() {
    return (
        <aside className="app-sidebar p-6">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-12 px-2">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-display font-bold text-xl">
                    F
                </div>
                <div>
                    <h1 className="text-xl font-display font-bold leading-none tracking-tight">FinTrak</h1>
                    <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase mt-1">Wealth</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300",
                                    "text-zinc-400 font-medium hover:text-white",
                                    isActive && "bg-white/5 text-white"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        size={22}
                                        className={cn(
                                            "transition-colors duration-300",
                                            isActive ? "text-accent-lime" : "text-zinc-500 group-hover:text-zinc-300"
                                        )}
                                    />
                                    <span className="font-display tracking-tight text-[15px]">{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-lime shadow-[0_0_8px_rgba(212,255,0,0.8)]" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Area */}
            <div className="mt-auto">
                <div className="p-4 rounded-2xl bg-surface border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=Ravi+Varma&background=000&color=fff&font-family=Space+Grotesk" alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-bold text-white truncate">Ravi Varma</p>
                        <p className="text-xs text-zinc-500 truncate">Pro Member</p>
                    </div>
                    <button className="text-zinc-500 hover:text-white transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
