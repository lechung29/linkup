/** @format */

"use client";

import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";

interface NavbarProps {
    session: Session | null;
}

export function Navbar({ session }: NavbarProps) {
    const user = session?.user;
    const initials =
        user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "?";

    return (
        <motion.nav
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex items-center justify-between px-8 py-5"
        >
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-linear-to-br from-[#6346ff] to-[#8b6aff] shadow-[0_4px_16px_rgba(99,70,255,0.4)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <rect x="3" y="5" width="4" height="14" rx="2" />
                        <rect x="10" y="2" width="4" height="20" rx="2" />
                        <rect x="17" y="7" width="4" height="10" rx="2" />
                    </svg>
                </div>
                <span className="text-white font-bold text-lg tracking-tight">Meetly</span>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl px-3 py-2 border border-transparent outline-none transition-all duration-200 hover:bg-white/5 hover:border-white/10">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.image ?? ""} />
                        <AvatarFallback className="bg-[#6346ff] text-white text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-white/70 text-sm font-medium hidden sm:block">{user?.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-white/10 bg-[#111420]/90 backdrop-blur-xl text-white/80">
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="gap-2 cursor-pointer hover:text-white focus:text-white focus:bg-white/5">
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </motion.nav>
    );
}
