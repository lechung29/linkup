/** @format */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Session } from "next-auth";
import { Navbar } from "./Navbar";
import { GlassCard } from "./GlassCard";
import { CreateRoom } from "./CreateRoom";
import { TabSwitcher } from "./TabSwitch";
import { JoinRoom } from "./JohnRoom";

interface HomePageProps {
    session: Session | null;
}

export default function HomePage({ session }: HomePageProps) {
    const [activeTab, setActiveTab] = useState<"create" | "join">("create");

    return (
        <React.Fragment>
            <Navbar session={session} />
            <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ zIndex: 10 }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Start a meeting</h1>
                        <p className="text-white/40 text-sm">Create a new room or join with a code</p>
                    </div>

                    <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

                    <GlassCard>
                        <AnimatePresence mode="wait">
                            {activeTab === "create" ? (
                                <motion.div key="create" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                    <CreateRoom />
                                </motion.div>
                            ) : (
                                <motion.div key="join" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                                    <JoinRoom />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </GlassCard>

                    <p className="text-center text-white/15 text-xs mt-6 tracking-wide">Your meetings are encrypted end-to-end</p>
                </motion.div>
            </div>
        </React.Fragment>
    );
}
