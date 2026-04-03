/** @format */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { useParticipants } from "@livekit/components-react";
import { X, Send, SmilePlus, Loader2, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useRoomStore } from "@/store/useRoomStore";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";
import { createPortal } from "react-dom";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];
const COLORS = ["bg-violet-500", "bg-orange-400", "bg-blue-500", "bg-green-500", "bg-pink-500", "bg-yellow-500"];

interface Reaction {
    emoji: string;
    identities: string[];
}
interface Message {
    _id: string;
    identity: string;
    name: string;
    avatar: string;
    message: string;
    reactions: Reaction[];
    createdAt: string;
}

interface ChatPanelProps {
    activePanel: "chat" | "participants";
    onPanelChange: (panel: "chat" | "participants") => void;
    onClose: () => void;
    session: Session;
    participantCount: number;
    isHost: boolean;
    isOverflow: boolean;
    roomId: string;
    isDrawer?: boolean;
}

function EmojiPicker({ onPick, onClose, anchorEl }: { onPick: (e: string) => void; onClose: () => void; anchorEl: HTMLButtonElement | null }) {
    const [style, setStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (!anchorEl) return;
        const rect = anchorEl.getBoundingClientRect();
        const pickerWidth = 292;
        let left = rect.left - pickerWidth + rect.width;
        if (left < 8) left = 8;
        if (left + pickerWidth > window.innerWidth - 8) left = window.innerWidth - pickerWidth - 8;
        let top = rect.top - 48;
        if (top < 8) top = rect.bottom + 8;
        setStyle({ position: "fixed", top, left, zIndex: 9999 });
    }, [anchorEl]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (anchorEl && anchorEl.contains(e.target as Node)) return;
            onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [anchorEl, onClose]);

    if (!anchorEl || !style.top) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.12 }}
            style={style}
            className="bg-[#111318]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
            <div className="flex gap-1">
                {EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onPick(emoji);
                            onClose();
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-base"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </motion.div>,
        document.body,
    );
}

function MessageBubble({ msg, isMe, onReact, identity }: { msg: Message; isMe: boolean; onReact: (msgId: string, emoji: string) => void; identity: string }) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const initials = msg.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    const colorIndex = msg.identity.charCodeAt(0) % COLORS.length;
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const handleReactButton = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(anchorEl ? null : e.currentTarget);
    };

    return (
        <div className={cn("flex gap-2 group", isMe && "flex-row-reverse")}>
            <Avatar className="w-7 h-7 shrink-0 mt-1">
                <AvatarImage src={msg.avatar} />
                <AvatarFallback className={`${COLORS[colorIndex]} text-white text-[10px] font-semibold`}>{initials}</AvatarFallback>
            </Avatar>

            <div className={cn("flex flex-col gap-1 max-w-[75%]", isMe && "items-end")}>
                <div className={cn("flex items-center gap-1.5 px-1", isMe && "flex-row-reverse")}>
                    <span className="text-white/50 text-[11px] font-medium">{isMe ? "You" : msg.name}</span>
                    <span className="text-white/20 text-[10px]">{time}</span>
                </div>

                <div className={cn("flex items-end gap-1", isMe && "flex-row-reverse")}>
                    <div className={cn("rounded-2xl px-3 py-2 text-sm leading-relaxed", isMe ? "bg-[#6346ff]/30 text-white rounded-tr-sm" : "bg-white/6 text-white/80 rounded-tl-sm")}>
                        {msg.message}
                    </div>
                    <button
                        onClick={handleReactButton}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <SmilePlus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {msg.reactions.filter((r) => r.identities.length > 0).length > 0 && (
                    <div className={cn("flex flex-wrap gap-1 px-1", isMe && "justify-end")}>
                        {msg.reactions
                            .filter((r) => r.identities.length > 0)
                            .map((r) => {
                                const reacted = r.identities.includes(identity);
                                return (
                                    <button
                                        key={r.emoji}
                                        onClick={() => onReact(msg._id, r.emoji)}
                                        className={cn(
                                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all duration-200 border",
                                            reacted ? "bg-[#6346ff]/20 border-[#6346ff]/40 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10",
                                        )}
                                    >
                                        <span>{r.emoji}</span>
                                        <span>{r.identities.length}</span>
                                    </button>
                                );
                            })}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {anchorEl && (
                    <EmojiPicker
                        anchorEl={anchorEl}
                        onPick={(emoji) => {
                            onReact(msg._id, emoji);
                            setAnchorEl(null);
                        }}
                        onClose={() => setAnchorEl(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ChatPanel({ activePanel, onPanelChange, onClose, session, participantCount, isHost, isOverflow, roomId, isDrawer = false }: ChatPanelProps) {
    const socket = useSocket();
    const participants = useParticipants();
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { pinnedIdentities, togglePinned } = useRoomStore();

    const myIdentity = session.user?.email || "";
    const allIdentities = participants.map((p) => p.identity);

    useEffect(() => {
        fetch(`/api/messages?roomId=${roomId}`)
            .then((r) => r.json())
            .then((d) => {
                setMessages(d.messages || []);
                setLoading(false);
            });
    }, [roomId]);

    useEffect(() => {
        if (!socket) return;
        const handleMessage = (msg: Message) => {
            setMessages((prev) => {
                if (prev.find((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        };
        const handleReaction = (updatedMsg: Message) => {
            setMessages((prev) => prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)));
        };
        socket.on("chat:message", handleMessage);
        socket.on("chat:reaction_update", handleReaction);
        return () => {
            socket.off("chat:message", handleMessage);
            socket.off("chat:reaction_update", handleReaction);
        };
    }, [socket]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!message.trim() || sending) return;
        setSending(true);
        const text = message.trim();
        setMessage("");
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, message: text }),
            });
            const data = await res.json();
            socket?.emit("chat:send", { roomId, message: data.message });
        } catch {
            setMessage(text);
        } finally {
            setSending(false);
        }
    };

    const handleReact = useCallback(
        async (msgId: string, emoji: string) => {
            try {
                const res = await fetch(`/api/messages/${msgId}/reaction`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emoji }),
                });
                const data = await res.json();
                socket?.emit("chat:reaction", { roomId, message: data.message });
            } catch {}
        },
        [socket, roomId],
    );

    return (
        <div className={cn("flex flex-col bg-[#0d0f14]/95 backdrop-blur-sm", "w-80 border-l border-white/6", isDrawer && "h-full rounded-t-2xl border-l-0 border-t border-white/6")}>
            {isDrawer && (
                <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
            )}

            <div className="flex items-center border-b border-white/6 p-3 gap-2">
                <div className="flex-1 flex bg-white/6 rounded-xl p-1">
                    {(["chat", "participants"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onPanelChange(tab)}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 cursor-pointer",
                                activePanel === tab ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60",
                            )}
                        >
                            {tab === "participants" ? `${tab} (${participantCount})` : tab}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {activePanel === "chat" ? (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading ? (
                            <div className="flex justify-center mt-8">
                                <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-white/20 text-xs text-center mt-8">No messages yet</p>
                        ) : (
                            messages.map((msg) => <MessageBubble key={msg._id} msg={msg} isMe={msg.identity === myIdentity} onReact={handleReact} identity={myIdentity} />)
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="p-3 border-t border-white/6">
                        <div className="flex items-center gap-2 bg-white/6 border border-white/6 rounded-xl px-3 py-2">
                            <input
                                value={message}
                                disabled={loading}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                placeholder="Send a message..."
                                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 outline-none"
                            />
                            <button onClick={handleSend} disabled={!message.trim() || sending} className="text-[#6346ff] hover:text-[#8b6aff] disabled:text-white/20 transition-colors">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isHost && isOverflow && <p className="text-white/30 text-xs text-center mb-3 leading-relaxed">Click the 👁 icon to switch the displayed participant</p>}
                    {participants.map((p) => {
                        const initials =
                            p.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() ?? "?";
                        const isPinned = pinnedIdentities.includes(p.identity);
                        const colorIndex = p.identity.charCodeAt(0) % COLORS.length;
                        return (
                            <div key={p.identity} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/6 transition-colors">
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback className={`${COLORS[colorIndex]} text-white text-xs font-semibold`}>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/80 text-sm font-medium truncate">{p.name || p.identity}</p>
                                    <p className="text-white/30 text-xs">
                                        {p.isMicrophoneEnabled ? "🎤 Mic on" : "🔇 Mic off"} • {p.isCameraEnabled ? "📹 Cam on" : "📷 Cam off"}
                                    </p>
                                </div>
                                {isHost && isOverflow && (
                                    <button
                                        onClick={() => togglePinned(p.identity, allIdentities)}
                                        className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
                                            isPinned ? "text-white/50 hover:text-white hover:bg-white/5" : "text-white/20 hover:text-white/40 hover:bg-white/5",
                                        )}
                                    >
                                        {isPinned ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
