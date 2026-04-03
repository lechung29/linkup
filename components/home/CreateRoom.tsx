/** @format */

"use client";

import { useState } from "react";
import { Copy, Check, Link } from "lucide-react";
import { nanoid } from "nanoid";
import { PrimaryButton } from "@/components/ui/primary-button";
import { CreateRoomDialog } from "./CreateRoomSettingDialog";
import { AnimatePresence, motion } from "framer-motion";

function CopyField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-white/30 text-xs uppercase tracking-widest px-1">{label}</span>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/4 border border-white/8">
                <span className="text-white/20 shrink-0">{icon}</span>
                <span className="flex-1 text-white/80 font-mono text-sm tracking-wider truncate">{value}</span>
                <button onClick={handleCopy} className="text-white/40 hover:text-white transition-colors shrink-0 cursor-pointer">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

export function CreateRoom() {
    const [generatedId, setGeneratedId] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleGenerate = () => setGeneratedId(nanoid(10));

    const roomUrl = generatedId ? `${window.location.origin}/room/${generatedId}` : "";

    return (
        <>
            <div className="flex flex-col gap-4">
                <p className="text-white/50 text-sm text-center mb-2">Generate a unique room code to share with others</p>

                <AnimatePresence>
                    {generatedId && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
                            <CopyField label="Room Code" value={generatedId} icon={<span className="text-xs font-mono">#</span>} />
                            <CopyField label="Room URL" value={roomUrl} icon={<Link className="w-3.5 h-3.5" />} />
                        </motion.div>
                    )}
                </AnimatePresence>
                {!generatedId && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/4 border border-white/8">
                        <span className="flex-1 text-white/20 text-sm">Click generate to get a code</span>
                    </div>
                )}

                <PrimaryButton onClick={handleGenerate} uiVariant={generatedId ? "outline" : "filled"} tone="dark" className="w-full">
                    {generatedId ? "Regenerate code" : "Generate room code"}
                </PrimaryButton>

                {generatedId && (
                    <PrimaryButton onClick={() => setDialogOpen(true)} uiVariant="filled" tone="dark" className="w-full">
                        Start meeting
                    </PrimaryButton>
                )}
            </div>
            <CreateRoomDialog open={dialogOpen} roomId={generatedId} onClose={() => setDialogOpen(false)} />
        </>
    );
}
