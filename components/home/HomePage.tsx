/** @format */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Video, LogIn, LogOut, Copy, Check, ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";
import { OrbItem } from "../auth/orbItem";
import { FloatingShape } from "../auth/floatingShape";

interface HomePageProps {
    session: Session | null;
}

export default function HomePage({ session }: HomePageProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"create" | "join">("create");
    const [roomId, setRoomId] = useState("");
    const [generatedId, setGeneratedId] = useState("");
    const [copied, setCopied] = useState(false);
    const [joining, setJoining] = useState(false);

    const user = session?.user;
    const initials =
        user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "?";

    const handleGenerateRoom = () => {
        const id = nanoid(10);
        setGeneratedId(id);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStartRoom = () => {
        if (generatedId) router.push(`/room/${generatedId}`);
    };

    const handleJoinRoom = () => {
        if (!roomId.trim()) return;
        setJoining(true);
        router.push(`/room/${roomId.trim()}`);
    };

    return (
        <React.Fragment>
            <motion.nav
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex items-center justify-between px-8 py-5"
                style={{ zIndex: 10 }}
            >
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                            background: "linear-gradient(135deg, #6346ff, #8b6aff)",
                            boxShadow: "0 4px 16px rgba(99,70,255,0.4)",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <rect x="3" y="5" width="4" height="14" rx="2" />
                            <rect x="10" y="2" width="4" height="20" rx="2" />
                            <rect x="17" y="7" width="4" height="10" rx="2" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">Meetly</span>
                </div>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <button className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/10">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={user?.image ?? ""} />
                                <AvatarFallback className="bg-[#6346ff] text-white text-xs font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-white/70 text-sm font-medium hidden sm:block">{user?.name}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-white/10 bg-[#111420]/90 backdrop-blur-xl text-white/80">
                        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="gap-2 cursor-pointer hover:text-white focus:text-white focus:bg-white/5">
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </motion.nav>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ zIndex: 10 }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="w-full max-w-md">
                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Start a meeting</h1>
                        <p className="text-white/40 text-sm">Create a new room or join with a code</p>
                    </div>

                    {/* Tabs */}
                    <div
                        className="flex rounded-xl p-1 mb-6"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {(["create", "join"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                                style={{
                                    background: activeTab === tab ? "rgba(99,70,255,0.3)" : "transparent",
                                    color: activeTab === tab ? "white" : "rgba(255,255,255,0.35)",
                                    boxShadow: activeTab === tab ? "0 2px 12px rgba(99,70,255,0.2)" : "none",
                                    border: activeTab === tab ? "1px solid rgba(99,70,255,0.4)" : "1px solid transparent",
                                }}
                            >
                                {tab === "create" ? <Video className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                                {tab === "create" ? "New meeting" : "Join meeting"}
                            </button>
                        ))}
                    </div>

                    {/* Card */}
                    <motion.div
                        className="relative overflow-hidden rounded-3xl"
                        style={{
                            padding: "36px 32px",
                            background: "rgba(255,255,255,0.04)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                        }}
                    >
                        {/* Top shimmer */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/5" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />

                        <AnimatePresence mode="wait">
                            {activeTab === "create" ? (
                                <motion.div
                                    key="create"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col gap-4"
                                >
                                    <p className="text-white/50 text-sm text-center mb-2">Generate a unique room code to share with others</p>

                                    {/* Generated ID display */}
                                    <div
                                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                                        style={{
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <span className="flex-1 text-white/80 font-mono text-sm tracking-wider">
                                            {generatedId || <span className="text-white/20">Click generate to get a code</span>}
                                        </span>
                                        {generatedId && (
                                            <button onClick={handleCopy} className="text-white/40 hover:text-white transition-colors">
                                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>

                                    <PrimaryButton onClick={handleGenerateRoom} uiVariant={generatedId ? "outline" : "filled"} tone="dark" className="w-full">
                                        {generatedId ? "Regenerate code" : "Generate room code"}
                                    </PrimaryButton>

                                    {generatedId && (
                                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                                            <PrimaryButton onClick={handleStartRoom} uiVariant="filled" tone="dark" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full">
                                                Start meeting
                                            </PrimaryButton>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="join"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col gap-4"
                                >
                                    <p className="text-white/50 text-sm text-center mb-2">Enter the room code shared by the meeting host</p>

                                    <Input
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                                        placeholder="Enter room code..."
                                        className="h-12 rounded-xl bg-white/4 border-white/8 text-white placeholder:text-white/20 focus-visible:ring-[#6346ff]/50 focus-visible:border-[#6346ff]/50 font-mono tracking-wider"
                                    />

                                    <PrimaryButton
                                        onClick={handleJoinRoom}
                                        isLoading={joining}
                                        disabled={!roomId.trim()}
                                        uiVariant="filled"
                                        tone="dark"
                                        rightIcon={<ArrowRight className="w-4 h-4" />}
                                        className="w-full"
                                    >
                                        Join meeting
                                    </PrimaryButton>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Bottom hint */}
                    <p className="text-center text-white/15 text-xs mt-6 tracking-wide">Your meetings are encrypted end-to-end</p>
                </motion.div>
            </div>
        </React.Fragment>
    );
}
