/** @format */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MonitorUp, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ScreenShareRequestProps {
    requester: { name: string; image: string } | null;
    onApprove: () => void;
    onReject: () => void;
}

export default function ScreenShareRequest({ requester, onApprove, onReject }: ScreenShareRequestProps) {
    const initials =
        requester?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "?";

    return (
        <AnimatePresence>
            {requester && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm"
                >
                    <div className="mx-4 bg-[#111318]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/5 bg-linear-to-r from-transparent via-white/15 to-transparent" />

                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#6346ff]/20 border border-[#6346ff]/30 flex items-center justify-center shrink-0">
                                <MonitorUp className="w-4 h-4 text-[#a78bfa]" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="w-5 h-5">
                                        <AvatarImage src={requester.image} />
                                        <AvatarFallback className="bg-[#6346ff] text-white text-[10px] font-semibold">{initials}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-white text-sm font-semibold truncate">{requester.name}</p>
                                </div>
                                <p className="text-white/40 text-xs leading-relaxed">muốn chia sẻ màn hình. Bạn có muốn nhường quyền không?</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={onReject}
                                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all duration-200"
                            >
                                <X className="w-3.5 h-3.5" />
                                Từ chối
                            </button>
                            <button
                                onClick={onApprove}
                                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#6346ff]/20 border border-[#6346ff]/40 hover:bg-[#6346ff]/30 text-[#a78bfa] hover:text-white text-xs font-medium transition-all duration-200"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Đồng ý nhường
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
