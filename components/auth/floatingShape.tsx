/** @format */

"use client";
import { motion } from "framer-motion";

interface FloatingShapeProps {
    shape: "ring" | "triangle" | "dot" | "cross";
    x: string;
    y: string;
    size: number;
    opacity: number;
    duration: number;
    delay?: number;
}

export function FloatingShape({ shape, x, y, size, opacity, duration, delay = 0 }: FloatingShapeProps) {
    return (
        <motion.div
            aria-hidden
            animate={{ y: [0, -15, 8, -5, 0], rotate: [0, 8, -5, 3, 0], opacity: [opacity, opacity * 1.3, opacity * 0.8, opacity] }}
            transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
            className="fixed pointer-events-none"
            style={{ left: x, top: y, zIndex: 1 }}
        >
            {shape === "ring" && <div style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid rgba(255,255,255,${opacity})` }} />}
            {shape === "dot" && <div style={{ width: size, height: size, borderRadius: "50%", background: `rgba(255,255,255,${opacity})` }} />}
            {shape === "triangle" && (
                <svg width={size} height={size} viewBox="0 0 50 50">
                    <polygon points="25,5 47,43 3,43" fill="none" stroke={`rgba(255,255,255,${opacity})`} strokeWidth="1.5" />
                </svg>
            )}
            {shape === "cross" && (
                <svg width={size} height={size} viewBox="0 0 30 30">
                    <line x1="15" y1="3" x2="15" y2="27" stroke={`rgba(255,255,255,${opacity})`} strokeWidth="1.5" />
                    <line x1="3" y1="15" x2="27" y2="15" stroke={`rgba(255,255,255,${opacity})`} strokeWidth="1.5" />
                </svg>
            )}
        </motion.div>
    );
}
