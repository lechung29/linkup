/** @format */

"use client";

import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";
import { LogoWithText } from "../ui/logo";

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
            <LogoWithText />
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl px-3 py-2 border border-transparent outline-none transition-all duration-200 hover:bg-white/5 hover:border-white/10 cursor-pointer">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.image ?? ""} />
                        <AvatarFallback className="bg-[#6346ff] text-white text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-white/70 text-sm font-medium hidden sm:block">{user?.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-white/10 bg-[#111420]/90 backdrop-blur-xl text-white/80 group">
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="gap-2 cursor-pointer hover:!text-white focus:text-white focus:bg-white/5">
                        <LogOut className="w-4 h-4" color="#fff" />
                        Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </motion.nav>
    );
}
