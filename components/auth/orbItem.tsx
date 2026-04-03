/** @format */

"use client";
import { motion } from "framer-motion";

interface OrbProps {
    size: number;
    x: string;
    y: string;
    color: string;
    duration: number;
    delay?: number;
}

export function OrbItem({ size, x, y, color, duration, delay = 0 }: OrbProps) {
    return (
        <motion.div
            aria-hidden
            animate={{ x: [0, 30, -20, 10, 0], y: [0, -20, 30, -10, 0], scale: [1, 1.05, 0.97, 1.03, 1] }}
            transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
            className="fixed rounded-full pointer-events-none"
            style={{ left: x, top: y, width: size, height: size, background: color, filter: "blur(80px)", zIndex: 0 }}
        />
    );
}
