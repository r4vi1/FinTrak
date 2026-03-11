import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, WalletCards, Activity, Layers, LogOut, ChevronLeft, ChevronRight, Fingerprint, Tags } from "lucide-react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
    { path: "/", icon: LayoutDashboard, label: "Overview" },
    { path: "/transactions", icon: WalletCards, label: "Transactions" },
    { path: "/categories", icon: Tags, label: "Categories" },
    { path: "/analytics", icon: Activity, label: "Insights" },
    { path: "/accounts", icon: Layers, label: "Linked Accounts" },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {

    return (
        <aside
            className={cn(
                "app-sidebar py-6 px-4",
                isCollapsed ? "w-[88px]" : "w-[280px]"
            )}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all duration-200 z-50 hover:scale-110"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Brand - Dynamic Logo */}
            <div className={cn("flex items-center gap-3 mb-12", isCollapsed ? "justify-center" : "px-2")}>
                <div className="relative group flex-shrink-0">
                    <div className="absolute inset-0 bg-accent-lime rounded-xl blur-md opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center relative z-10 overflow-hidden">
                        {/* Fingerprint icon gives clinical/tech vibe */}
                        <Fingerprint className="text-accent-lime w-6 h-6 transform -rotate-12" strokeWidth={1.5} />
                        <div className="absolute top-0 right-0 w-4 h-4 bg-accent-cyan rounded-bl-full opacity-50"></div>
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="animate-in" style={{ animationDuration: '0.3s' }}>
                        <h1 className="text-2xl font-display font-bold leading-none tracking-tighter">FIN<span className="text-zinc-500">TRAK</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 rounded-full bg-accent-lime animate-pulse" />
                            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Private Wealth</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "group flex items-center rounded-2xl transition-all duration-300 relative overflow-visible",
                                    isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3.5",
                                    "text-zinc-500 font-medium hover:text-white hover:bg-white/5",
                                    isActive && "bg-elevated border border-white/5 text-white shadow-lg"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        size={22}
                                        className={cn(
                                            "transition-all duration-300 relative z-10",
                                            isActive ? "text-accent-lime scale-110" : "group-hover:text-zinc-300 group-hover:rotate-[-5deg]"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    {!isCollapsed && (
                                        <span className="font-display tracking-tight text-[15px] relative z-10">{item.label}</span>
                                    )}
                                    {isActive && !isCollapsed && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-lime shadow-[0_0_8px_rgba(212,255,0,0.8)] relative z-10" />
                                    )}

                                    {/* Active highlight bg */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-accent-lime/10 to-transparent opacity-50 rounded-2xl" />
                                    )}

                                    {/* Tooltip when collapsed */}
                                    {isCollapsed && (
                                        <span className="sidebar-tooltip">{item.label}</span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Area */}
            <div className="mt-auto pt-4">
                <div className={cn(
                    "rounded-2xl bg-black border border-zinc-800 flex items-center transition-all duration-300",
                    isCollapsed ? "p-2 justify-center" : "p-3 gap-3"
                )}>
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                        <span className="font-display font-bold text-sm">RV</span>
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-display font-bold text-white truncate">Ravi Varma</p>
                                <p className="text-[11px] text-accent-cyan tracking-wider uppercase font-bold">Pro Member</p>
                            </div>
                            <button className="text-zinc-600 hover:text-accent-rose transition-colors p-1">
                                <LogOut size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
