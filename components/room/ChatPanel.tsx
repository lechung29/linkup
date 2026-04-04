/** @format */

"use client";

import { useState, useRef, useEffect, useCallback, type CSSProperties } from "react";
import { Session } from "next-auth";
import { useParticipants } from "@livekit/components-react";
import { X, Send, SmilePlus, Loader2, Paperclip, FileText, Eye, EyeOff, Upload, DownloadIcon, Hand, HandMetal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useRoomStore } from "@/store/useRoomStore";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

const SEND_EMOJIS = [
    "😀",
    "😂",
    "😅",
    "😊",
    "😍",
    "🥰",
    "😎",
    "😭",
    "🥺",
    "😤",
    "🙄",
    "😏",
    "🤔",
    "🤩",
    "🥳",
    "🤯",
    "🤧",
    "😷",
    "😵",
    "🤪",
    "👍",
    "👎",
    "👏",
    "🙌",
    "🤝",
    "💪",
    "🤞",
    "✌️",
    "👌",
    "🤙",
    "👋",
    "🫶",
    "🙏",
    "🫂",
    "✊",
    "☝️",
    "🫵",
    "💅",
    "🤜",
    "🤛",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "💕",
    "💯",
    "🎉",
    "🎊",
    "🚀",
    "🔥",
    "⭐",
    "🏆",
    "🎯",
    "💡",
    "🌟",
    "💎",
    "✅",
    "❌",
    "⚠️",
    "📢",
    "💬",
    "📝",
    "🔗",
    "🎵",
    "📸",
    "🎮",
];

const COLORS = ["bg-violet-500", "bg-orange-400", "bg-blue-500", "bg-green-500", "bg-pink-500", "bg-yellow-500"];

const IMAGE_LIMIT = 5 * 1024 * 1024;
const FILE_LIMIT = 10 * 1024 * 1024;

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readJsonResponse<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (!text) return null as T;

    try {
        return JSON.parse(text) as T;
    } catch {
        throw new Error("Server returned invalid JSON");
    }
}

function getFileTypeLabel(mimeType?: string, fileName?: string) {
    if (!mimeType) return "FILE";
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.includes("word")) return "DOC";
    if (mimeType.includes("sheet")) return "XLS";
    if (mimeType.includes("presentation")) return "PPT";
    if (mimeType.includes("zip")) return "ZIP";
    const ext = fileName?.split(".").pop()?.toUpperCase();
    return ext || "FILE";
}

interface Reaction {
    emoji: string;
    identities: string[];
}

interface FileData {
    url: string;
    name: string;
    size: number;
    mimeType: string;
}

interface Message {
    _id: string;
    identity: string;
    name: string;
    avatar: string;
    message: string;
    type?: "text" | "image" | "file";
    fileData?: FileData;
    reactions: Reaction[];
    createdAt: string;
}

interface PendingFile {
    file: File;
    previewUrl: string;
    name: string;
    size: number;
    mimeType: string;
    type: "image" | "file";
}

interface ChatPanelProps {
    activePanel: "chat" | "participants" | "hands";
    onPanelChange: (panel: "chat" | "participants" | "hands") => void;
    onClose: () => void;
    session: Session;
    participantCount: number;
    isHost: boolean;
    isOverflow: boolean;
    roomId: string;
    raisedHands: Array<{ identity: string; name?: string; image?: string }>;
    isDrawer?: boolean;
}

function ReactionPicker({ onPick, onClose, anchorEl }: { onPick: (e: string) => void; onClose: () => void; anchorEl: HTMLButtonElement | null }) {
    const [style, setStyle] = useState<CSSProperties>({});

    useEffect(() => {
        if (!anchorEl) return;
        const rect = anchorEl.getBoundingClientRect();
        const W = 292;
        let left = rect.left - W + rect.width;
        if (left < 8) left = 8;
        if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
        let top = rect.top - 48;
        if (top < 8) top = rect.bottom + 8;
        setStyle({ position: "fixed", top, left, zIndex: 9999 });
    }, [anchorEl]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (anchorEl?.contains(e.target as Node)) return;
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
                {REACTION_EMOJIS.map((emoji) => (
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

function SendEmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (t.closest("[data-emoji-picker]") || t.closest("[data-emoji-btn]")) return;
            onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <motion.div
            data-emoji-picker
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-[#111318]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50"
        >
            <div className="grid grid-cols-10 gap-0.5 max-h-48 overflow-y-auto chat-scroll">
                {SEND_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onPick(emoji);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-lg leading-none"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

function MessageBubble({ msg, isMe, onReact, identity }: { msg: Message; isMe: boolean; onReact: (msgId: string, emoji: string) => void; identity: string }) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const initials = msg.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    const colorIndex = msg.identity.charCodeAt(0) % COLORS.length;
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const msgType = msg.type ?? (msg.fileData?.mimeType?.startsWith("image/") ? "image" : msg.fileData ? "file" : "text");

    const bubbleStyle = isMe ? "bg-[#795aff]/30 text-white rounded-tr-sm" : "bg-white/6 text-white/80 rounded-tl-sm";

    const downloadFile = async (fileData: FileData) => {
        try {
            const res = await fetch(fileData.url);
            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileData.name;
            document.body.appendChild(a);
            a.click();
            a.remove();

            URL.revokeObjectURL(blobUrl);
        } catch {
            const a = document.createElement("a");
            a.href = fileData.url;
            a.download = fileData.name;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    };

    const renderContent = () => {
        if (msgType === "image" && msg.fileData) {
            return (
                <>
                    <button type="button" onClick={() => setPreviewOpen(true)} className="block w-full text-left cursor-zoom-in">
                        <img src={msg.fileData.url} alt={msg.fileData.name} className="max-w-50 max-h-50 w-full object-cover block rounded-2xl" />
                    </button>

                    <Lightbox
                        open={previewOpen}
                        close={() => setPreviewOpen(false)}
                        slides={[
                            {
                                src: msg.fileData.url,
                                download: {
                                    url: msg.fileData.url,
                                    filename: msg.fileData.name,
                                },
                            },
                        ]}
                        plugins={[Download]}
                        controller={{ closeOnBackdropClick: true }}
                    />
                </>
            );
        }

        if (msgType === "file" && msg.fileData) {
            return (
                <button
                    type="button"
                    onClick={() => downloadFile(msg.fileData!)}
                    className="flex items-center gap-2.5 px-3 py-2.5 group/dl hover:bg-white/5 transition-colors rounded-2xl text-left w-full cursor-pointer"
                >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate max-w-27.5">{msg.fileData.name}</p>
                        <p className="text-xs text-white/40">
                            {formatSize(msg.fileData.size)} · {getFileTypeLabel(msg.fileData.mimeType, msg.fileData.name)}
                        </p>
                    </div>
                    <DownloadIcon className="w-3.5 h-3.5 text-white/30 group-hover/dl:text-white/70 transition-colors shrink-0" />
                </button>
            );
        }

        return <p className="text-sm leading-relaxed px-3 py-2 max-w-45 wrap-break-word">{msg.message}</p>;
    };

    return (
        <>
            <div className={cn("flex gap-2 group", isMe && "flex-row-reverse")}>
                <Avatar className="w-7 h-7 shrink-0 mt-1">
                    {msg.avatar ? <AvatarImage src={msg.avatar} /> : <AvatarFallback className={`${COLORS[colorIndex]} text-white text-[10px] font-semibold`}>{initials}</AvatarFallback>}
                </Avatar>

                <div className={cn("flex flex-col gap-1 max-w-[75%]", isMe && "items-end")}>
                    <div className={cn("flex items-center gap-1.5 px-1", isMe && "flex-row-reverse")}>
                        <span className="text-white/50 text-[11px] font-medium">{isMe ? "You" : msg.name}</span>
                        <span className="text-white/20 text-[10px]">{time}</span>
                    </div>

                    <div className={cn("flex items-end gap-1", isMe && "flex-row-reverse")}>
                        <div className={cn("rounded-2xl overflow-hidden", bubbleStyle)}>{renderContent()}</div>

                        <button
                            onClick={(e) => setAnchorEl(anchorEl ? null : (e.currentTarget as HTMLButtonElement))}
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
                        <ReactionPicker
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
        </>
    );
}

export default function ChatPanel({ activePanel, onPanelChange, onClose, session, participantCount, isHost, isOverflow, roomId, raisedHands, isDrawer = false }: ChatPanelProps) {
    const socket = useSocket();
    const participants = useParticipants();
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { pinnedIdentities, togglePinned } = useRoomStore();

    const myIdentity = session.user?.email || "";
    const allIdentities = participants.map((p) => p.identity);

    useEffect(() => {
        fetch(`/api/messages?roomId=${roomId}`)
            .then((r) => r.json())
            .then((d) => {
                setMessages(d.messages || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [roomId]);

    useEffect(() => {
        if (!socket) return;
        const onMessage = (msg: Message) => {
            setMessages((prev) => {
                if (prev.find((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        };
        const onReaction = (updated: Message) => {
            setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
        };
        socket.on("chat:message", onMessage);
        socket.on("chat:reaction_update", onReaction);
        return () => {
            socket.off("chat:message", onMessage);
            socket.off("chat:reaction_update", onReaction);
        };
    }, [socket]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        return () => {
            if (pendingFile) URL.revokeObjectURL(pendingFile.previewUrl);
        };
    }, [pendingFile]);

    const clearPendingFile = () => {
        if (pendingFile) URL.revokeObjectURL(pendingFile.previewUrl);
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith("image/");
        const limit = isImage ? IMAGE_LIMIT : FILE_LIMIT;

        if (file.size > limit) {
            toast.error(`File too large. Max ${isImage ? "5 MB" : "10 MB"}.`);
            e.target.value = "";
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPendingFile({
            file,
            previewUrl,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            type: isImage ? "image" : "file",
        });
        e.target.value = "";
    };

    const handleSend = async () => {
        if (!pendingFile && !message.trim()) return;
        if (sending || uploading) return;

        try {
            if (pendingFile) {
                setUploading(true);

                const formData = new FormData();
                formData.append("file", pendingFile.file);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const uploadData = await readJsonResponse<{ url?: string; error?: string }>(uploadRes);

                if (!uploadRes.ok) {
                    throw new Error(uploadData?.error ?? "Upload failed");
                }

                if (!uploadData?.url) {
                    throw new Error("Upload response missing url");
                }

                setUploading(false);
                setSending(true);

                const msgRes = await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomId,
                        message: "",
                        type: pendingFile.type,
                        fileData: {
                            url: uploadData.url,
                            name: pendingFile.name,
                            size: pendingFile.size,
                            mimeType: pendingFile.mimeType,
                        },
                    }),
                });

                const msgData = await readJsonResponse<{ message?: Message; error?: string }>(msgRes);

                if (!msgRes.ok) {
                    throw new Error(msgData?.error ?? "Failed to save message");
                }

                socket?.emit("chat:send", { roomId, message: msgData?.message });
                clearPendingFile();
            }

            if (message.trim()) {
                setSending(true);
                const text = message.trim();
                setMessage("");

                const res = await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId, message: text }),
                });

                const data = await readJsonResponse<{ message?: Message; error?: string }>(res);

                if (!res.ok) {
                    throw new Error(data?.error ?? "Failed to send message");
                }

                socket?.emit("chat:send", { roomId, message: data?.message });
            }
        } catch (err: any) {
            toast.error(err.message ?? "Failed to send.");
            setUploading(false);
        } finally {
            setSending(false);
            setUploading(false);
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
                const data = await readJsonResponse<{ message?: Message; error?: string }>(res);
                if (!res.ok) return;
                socket?.emit("chat:reaction", { roomId, message: data?.message });
            } catch {}
        },
        [socket, roomId],
    );

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = Array.from(e.clipboardData.items);
        const imageItem = items.find((item) => item.type.startsWith("image/"));
        if (!imageItem) return;

        e.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return;

        if (file.size > IMAGE_LIMIT) {
            toast.error("Pasted image too large. Max 5 MB.");
            return;
        }

        if (pendingFile) URL.revokeObjectURL(pendingFile.previewUrl);

        const name = file.name && file.name !== "image.png" ? file.name : `pasted-${Date.now()}.png`;
        setPendingFile({
            file: new File([file], name, { type: file.type }),
            previewUrl: URL.createObjectURL(file),
            name,
            size: file.size,
            mimeType: file.type,
            type: "image",
        });
    };

    const insertEmoji = (emoji: string) => {
        setMessage((prev) => prev + emoji);
        inputRef.current?.focus();
    };

    const isBusy = sending || uploading;

    return (
        <div className={cn("flex flex-col bg-[#0d0f14]/95 backdrop-blur-sm", "w-96 border-l border-white/6", isDrawer && "h-full rounded-t-2xl border-l-0 border-t border-white/6")}>
            {isDrawer && (
                <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
            )}

            <div className="flex items-center border-b border-white/6 p-3 gap-2">
                <div className="flex-1 flex gap-1 bg-white/6 rounded-xl px-1 py-1.5">
                    {(["chat", "participants", "hands"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onPanelChange(tab)}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 cursor-pointer",
                                activePanel === tab ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60",
                            )}
                        >
                            {tab === "participants" ? `${tab} (${participantCount})` : tab === "hands" ? `${tab} (${raisedHands.length})` : tab}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {activePanel === "chat" ? (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
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

                    <div className="py-3 px-2 border-t border-white/6 relative">
                        <AnimatePresence>{emojiOpen && <SendEmojiPicker onPick={insertEmoji} onClose={() => setEmojiOpen(false)} />}</AnimatePresence>

                        <AnimatePresence>
                            {pendingFile && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-center gap-2 bg-white/6 border border-white/10 rounded-xl px-3 py-2">
                                        {pendingFile.type === "image" ? (
                                            <img src={pendingFile.previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5 text-white/50" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white/80 text-xs font-medium truncate">{pendingFile.name}</p>
                                            <p className="text-white/30 text-[11px]">
                                                {formatSize(pendingFile.size)} · {getFileTypeLabel(pendingFile.mimeType, pendingFile.name)}
                                            </p>
                                        </div>
                                        {uploading ? (
                                            <Upload className="w-4 h-4 text-[#6346ff] animate-pulse shrink-0" />
                                        ) : (
                                            <button onClick={clearPendingFile} className="text-white/30 hover:text-white transition-colors shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="w-full flex items-center gap-1 bg-white/6 border border-white/6 rounded-xl px-1.5 py-2">
                            <button
                                data-emoji-btn
                                onClick={() => setEmojiOpen((o) => !o)}
                                disabled={isBusy}
                                className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer",
                                    emojiOpen ? "text-[#6346ff] bg-[#6346ff]/15" : "text-white/30 hover:text-white/70 hover:bg-white/5",
                                )}
                            >
                                <SmilePlus className="w-4 h-4" />
                            </button>

                            <input
                                ref={inputRef}
                                value={message}
                                disabled={loading || isBusy}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                onPaste={handlePaste}
                                placeholder="Send a message..."
                                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 outline-none"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isBusy}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>

                            <button
                                onClick={handleSend}
                                disabled={(!message.trim() && !pendingFile) || isBusy}
                                className="w-7 h-7 text-[#6346ff] hover:text-[#8b6aff] disabled:text-white/20 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#6346ff]" /> : sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z" onChange={handleFileChange} className="hidden" />
                    </div>
                </>
            ) : activePanel === "participants" ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-scroll">
                    {isHost && isOverflow && <p className="text-white/30 text-xs text-center mb-3 leading-relaxed">Click the 👁 icon to switch the displayed participant</p>}
                    {participants.map((p) => {
                        const initials =
                            p.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() ?? "?";
                        const avatarUrl = (() => {
                            try {
                                const meta = p.metadata ? JSON.parse(p.metadata) : {};
                                return meta.image ?? "";
                            } catch {
                                return "";
                            }
                        })();
                        const isPinned = pinnedIdentities.includes(p.identity);
                        const colorIndex = p.identity.charCodeAt(0) % COLORS.length;
                        return (
                            <div key={p.identity} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/6 transition-colors">
                                <Avatar className="w-8 h-8">
                                    {avatarUrl ? <AvatarImage src={avatarUrl} /> : <AvatarFallback className={`${COLORS[colorIndex]} text-white text-xs font-semibold`}>{initials}</AvatarFallback>}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/80 text-sm font-medium truncate">{p.name || p.identity}</p>
                                    <p className="text-white/30 text-xs">
                                        {p.isMicrophoneEnabled ? "🎤 Mic on" : "🔇 Mic off"} · {p.isCameraEnabled ? "📹 Cam on" : "📷 Cam off"}
                                    </p>
                                </div>
                                {isHost && isOverflow && (
                                    <button
                                        onClick={() => togglePinned(p.identity, allIdentities)}
                                        className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
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
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-scroll">
                    {raisedHands.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <HandMetal className="w-11 h-11 text-white/15 mb-3" />
                            <p className="text-white/35 text-sm font-medium">No one has raised hand yet</p>
                            <p className="text-white/20 text-xs mt-1">Raised hands will appear here in real time</p>
                        </div>
                    ) : (
                        raisedHands.map((hand) => {
                            const initials =
                                hand.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase() ?? "?";
                            const colorIndex = hand.identity.charCodeAt(0) % COLORS.length;
                            return (
                                <div key={hand.identity} className="flex items-center gap-3 p-2 rounded-xl bg-white/4 border border-white/6">
                                    <Avatar className="w-8 h-8">
                                        {hand.image ? (
                                            <AvatarImage src={hand.image} />
                                        ) : (
                                            <AvatarFallback className={`${COLORS[colorIndex]} text-white text-xs font-semibold`}>{initials}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/80 text-sm font-medium truncate">{hand.name || hand.identity}</p>
                                        <p className="text-white/30 text-xs">is raising hand</p>
                                    </div>
                                    <Hand className="w-4 h-4 text-[#a78bfa]" />
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
