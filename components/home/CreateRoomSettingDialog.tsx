/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PrimaryButton } from "@/components/ui/primary-button";
import { cn } from "@/lib/utils";

type JoinPolicy = "always" | "approval";

interface CreateRoomDialogProps {
    open: boolean;
    roomId: string;
    onClose: () => void;
}

const policies: { key: JoinPolicy; icon: React.ReactNode; title: string; desc: string }[] = [
    {
        key: "always",
        icon: <Users className="w-5 h-5" />,
        title: "Luôn cho phép tham gia",
        desc: "Bất kỳ ai có mã phòng đều có thể vào ngay lập tức",
    },
    {
        key: "approval",
        icon: <ShieldCheck className="w-5 h-5" />,
        title: "Yêu cầu chấp thuận từ chủ phòng",
        desc: "Người tham gia sẽ phải chờ chủ phòng chấp nhận",
    },
];

export function CreateRoomDialog({ open, roomId, onClose }: CreateRoomDialogProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [joinPolicy, setJoinPolicy] = useState<JoinPolicy>("always");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleStart = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, name, joinPolicy }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Something went wrong");
                return;
            }
            router.push(`/room/${roomId}`);
        } catch {
            setError("Cannot connect to server");
        } finally {
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-[#0d0f14]/95 backdrop-blur-2xl border border-white/10 text-white p-0 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
                {/* Top shimmer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/5 bg-linear-to-r from-transparent via-white/15 to-transparent" />

                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-white text-xl font-bold tracking-tight">Cài đặt phòng</DialogTitle>
                        <DialogDescription className="text-white/40 text-sm">Chọn cài đặt trước khi bắt đầu cuộc họp</DialogDescription>
                    </DialogHeader>

                    {/* Room code */}
                    <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-4 bg-white/4 border border-white/8">
                        <span className="text-white/40 text-xs uppercase tracking-widest">Mã phòng</span>
                        <span className="text-white font-mono text-sm tracking-wider">{roomId}</span>
                    </div>

                    {/* Room name */}
                    <div className="mb-6">
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Tên phòng</p>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={`Room ${roomId}`}
                            className="h-11 rounded-xl bg-white/4 border-white/8 text-white placeholder:text-white/20 focus-visible:ring-[#6346ff]/50 focus-visible:border-[#6346ff]/50"
                        />
                    </div>

                    {/* Join policy */}
                    <div className="mb-6">
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Quyền tham gia</p>
                        <div className="flex flex-col gap-2">
                            {policies.map(({ key, icon, title, desc }) => (
                                <motion.button
                                    key={key}
                                    onClick={() => setJoinPolicy(key)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={cn(
                                        "flex items-start gap-4 rounded-xl px-4 py-4 text-left transition-all duration-200",
                                        joinPolicy === key ? "bg-[#6346ff]/15 border border-[#6346ff]/60" : "bg-white/3 border border-white/6 hover:border-white/10",
                                    )}
                                >
                                    <div className={cn("mt-0.5 rounded-lg p-2 transition-colors duration-200", joinPolicy === key ? "bg-[#6346ff]/30 text-violet-300" : "bg-white/5 text-white/30")}>
                                        {icon}
                                    </div>

                                    <div className="flex-1">
                                        <p className={cn("text-sm font-medium mb-0.5 transition-colors duration-200", joinPolicy === key ? "text-white" : "text-white/60")}>{title}</p>
                                        <p className="text-white/30 text-xs leading-relaxed">{desc}</p>
                                    </div>

                                    <div
                                        className={cn(
                                            "mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                                            joinPolicy === key ? "border-[#6346ff] bg-[#6346ff]" : "border-white/20",
                                        )}
                                    >
                                        {joinPolicy === key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-xs text-center mb-4">{error}</p>}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors border border-white/6 hover:border-white/10"
                        >
                            Huỷ
                        </button>
                        <PrimaryButton onClick={handleStart} isLoading={loading} uiVariant="filled" tone="dark" rightIcon={<ArrowRight className="w-4 h-4" />} className="flex-1">
                            Bắt đầu
                        </PrimaryButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
