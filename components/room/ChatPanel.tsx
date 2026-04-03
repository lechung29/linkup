/** @format */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { useParticipants } from "@livekit/components-react";
import { X, Send, SmilePlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useRoomStore } from "@/store/useRoomStore";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";

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
}

function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-8 right-0 z-50 bg-[#111318]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
            <div className="flex gap-1">
                {EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => {
                            onPick(emoji);
                            onClose();
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-base"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

function MessageBubble({ msg, isMe, onReact, identity }: { msg: Message; isMe: boolean; onReact: (msgId: string, emoji: string) => void; identity: string }) {
    const [showPicker, setShowPicker] = useState(false);
    const initials = msg.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    const colorIndex = msg.identity.charCodeAt(0) % COLORS.length;
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <div className={cn("flex gap-2 group", isMe && "flex-row-reverse")}>
            {/* Avatar */}
            <Avatar className="w-7 h-7 flex-shrink-0 mt-1">
                <AvatarImage src={msg.avatar} />
                <AvatarFallback className={`${COLORS[colorIndex]} text-white text-[10px] font-semibold`}>{initials}</AvatarFallback>
            </Avatar>

            <div className={cn("flex flex-col gap-1 max-w-[75%]", isMe && "items-end")}>
                {/* Name + time */}
                <div className={cn("flex items-center gap-1.5 px-1", isMe && "flex-row-reverse")}>
                    <span className="text-white/50 text-[11px] font-medium">{isMe ? "You" : msg.name}</span>
                    <span className="text-white/20 text-[10px]">{time}</span>
                </div>

                {/* Bubble + reaction button */}
                <div className={cn("flex items-end gap-1", isMe && "flex-row-reverse")}>
                    <div className={cn("rounded-2xl px-3 py-2 text-sm leading-relaxed", isMe ? "bg-[#6346ff]/30 text-white rounded-tr-sm" : "bg-white/[0.06] text-white/80 rounded-tl-sm")}>
                        {msg.message}
                    </div>

                    {/* Reaction button */}
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setShowPicker(!showPicker)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <SmilePlus className="w-3.5 h-3.5" />
                        </button>
                        <AnimatePresence>{showPicker && <EmojiPicker onPick={(emoji) => onReact(msg._id, emoji)} onClose={() => setShowPicker(false)} />}</AnimatePresence>
                    </div>
                </div>

                {/* Reactions */}
                {msg.reactions.length > 0 && (
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
        </div>
    );
}

export default function ChatPanel({ activePanel, onPanelChange, onClose, session, participantCount, isHost, isOverflow, roomId }: ChatPanelProps) {
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

    // Load lịch sử chat
    useEffect(() => {
        fetch(`/api/messages?roomId=${roomId}`)
            .then((r) => r.json())
            .then((d) => {
                setMessages(d.messages || []);
                setLoading(false);
            });
    }, [roomId]);

    // Lắng nghe socket
    useEffect(() => {
        if (!socket) return;

        // Nhận message mới
        socket.on("chat:message", (msg: Message) => {
            setMessages((prev) => {
                if (prev.find((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        // Nhận reaction update
        socket.on("chat:reaction_update", (updatedMsg: Message) => {
            setMessages((prev) => prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)));
        });

        return () => {
            socket.off("chat:message");
            socket.off("chat:reaction_update");
        };
    }, [socket]);

    // Auto scroll
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

            // Broadcast qua socket
            socket?.emit("chat:send", { roomId, message: data.message });
        } catch {
            setMessage(text); // Restore nếu lỗi
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

                // Broadcast reaction update
                socket?.emit("chat:reaction", { roomId, message: data.message });
            } catch {}
        },
        [socket, roomId],
    );

    return (
        <div className="w-80 flex flex-col border-l border-white/[0.06] bg-[#0d0f14]/90 backdrop-blur-sm">
            {/* Tab header */}
            <div className="flex items-center border-b border-white/[0.06] p-3 gap-2">
                <div className="flex-1 flex bg-white/[0.04] rounded-xl p-1">
                    {(["chat", "participants"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onPanelChange(tab)}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200",
                                activePanel === tab ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60",
                            )}
                        >
                            {tab === "participants" ? `${tab} (${participantCount})` : tab}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all duration-200">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {activePanel === "chat" ? (
                <>
                    {/* Messages */}
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

                    {/* Input */}
                    <div className="p-3 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
                            <input
                                value={message}
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
                /* Participants list */
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isHost && isOverflow && <p className="text-white/30 text-xs text-center mb-3 leading-relaxed">Click 👁 để swap người hiển thị trong grid</p>}
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
                            <div key={p.identity} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
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
