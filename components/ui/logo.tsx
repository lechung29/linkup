/** @format */

"use client";
import { motion } from "framer-motion";

interface LogoWithTextProps {
    canNavigate?: boolean;
}

export function LinkupLogo() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <rect x="3" y="5" width="4" height="14" rx="2" />
            <rect x="10" y="2" width="4" height="20" rx="2" />
            <rect x="17" y="7" width="4" height="10" rx="2" />
        </svg>
    );
}

export function LogoWithText({ canNavigate = false }: LogoWithTextProps) {
    const onHandleClick = () => {
        if (canNavigate) {
            window.location.href = "/";
        }
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="flex items-center justify-center gap-3"
            onClick={onHandleClick}
        >
            <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shadow-[0_4px_20px_rgba(99,70,255,0.45)]"
                style={{ background: "linear-gradient(135deg, #6346ff, #8b6aff)" }}
            >
                <LinkupLogo />
            </motion.div>
            <span className="text-2xl font-bold text-white tracking-tight">Linkup</span>
        </motion.div>
    );
}
