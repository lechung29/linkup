/** @format */

"use client";

import { Video, LogIn } from "lucide-react";

type Tab = "create" | "join";

interface TabSwitcherProps {
    activeTab: Tab;
    onChange: (tab: Tab) => void;
}

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps) {
    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "create", label: "New meeting", icon: <Video className="w-4 h-4" /> },
        { key: "join", label: "Join meeting", icon: <LogIn className="w-4 h-4" /> },
    ];

    return (
        <div
            className="flex rounded-xl p-1 mb-6"
            style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            {tabs.map(({ key, label, icon }) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                    style={{
                        background: activeTab === key ? "rgba(99,70,255,0.3)" : "transparent",
                        color: activeTab === key ? "white" : "rgba(255,255,255,0.35)",
                        boxShadow: activeTab === key ? "0 2px 12px rgba(99,70,255,0.2)" : "none",
                        border: activeTab === key ? "1px solid rgba(99,70,255,0.4)" : "1px solid transparent",
                    }}
                >
                    {icon}
                    {label}
                </button>
            ))}
        </div>
    );
}
