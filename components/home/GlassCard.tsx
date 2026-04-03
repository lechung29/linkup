/** @format */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-3xl p-9 px-8",
                "bg-white/4 backdrop-blur-2xl",
                "border border-white/8",
                "shadow-[0_32px_80px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
                className,
            )}
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/5 bg-linear-to-r from-transparent via-white/12 to-transparent" />
            {children}
        </div>
    );
}
