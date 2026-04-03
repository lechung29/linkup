/** @format */

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/ui/primary-button";
import { FcGoogle } from "react-icons/fc";
import { BsFacebook } from "react-icons/bs";

function LinkupLogo() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <rect x="3" y="5" width="4" height="14" rx="2" />
            <rect x="10" y="2" width="4" height="20" rx="2" />
            <rect x="17" y="7" width="4" height="10" rx="2" />
        </svg>
    );
}

export default function LoginPage() {
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingFacebook, setLoadingFacebook] = useState(false);

    const handleGoogle = async () => {
        setLoadingGoogle(true);
        await signIn("google", { callbackUrl: "/" });
    };

    const handleFacebook = async () => {
        setLoadingFacebook(true);
        await signIn("facebook", { callbackUrl: "/" });
    };

    const isLoading = loadingGoogle || loadingFacebook;

    return (
        <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="relative w-full max-w-105 px-6"
            style={{ zIndex: 10 }}
        >
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                className="flex items-center justify-center gap-3 mb-10"
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

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="relative overflow-hidden rounded-3xl"
                style={{
                    padding: "44px 40px 40px",
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/5" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />

                <div className="text-center mb-9">
                    <h1 className="text-[28px] font-bold text-white mb-2.5 tracking-tight leading-tight">Welcome back</h1>
                    <p className="text-sm leading-relaxed text-white/40">Sign in to continue to Linkup</p>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/25">continue with</span>
                    <div className="flex-1 h-px bg-white/8" />
                </div>

                <div className="flex flex-col gap-3">
                    <PrimaryButton
                        onClick={handleGoogle}
                        brand="google"
                        disabled={isLoading}
                        isLoading={loadingGoogle}
                        leftIcon={<FcGoogle size={28} />}
                        uiVariant="filled"
                        tone="dark"
                        className="w-full"
                    >
                        Sign in with Google
                    </PrimaryButton>
                    <PrimaryButton
                        onClick={handleFacebook}
                        brand="default"
                        disabled={isLoading}
                        isLoading={loadingFacebook}
                        leftIcon={<BsFacebook size={16} />}
                        uiVariant="filled"
                        tone="dark"
                        className="w-full"
                    >
                        Sign in with Facebook
                    </PrimaryButton>
                </div>

                <p className="text-center mt-7 text-xs leading-relaxed text-white/20">
                    By signing in, you agree to our{" "}
                    <a href="#" className="text-white/40 hover:text-white transition-colors">
                        Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-white/40 hover:text-white transition-colors">
                        Privacy Policy
                    </a>
                </p>
            </motion.div>

            <p className="text-center mt-6 text-xs tracking-wide text-white/15">Protected by Google OAuth 2.0</p>
        </motion.div>
    );
}
