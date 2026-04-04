/** @format */

import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
    title: "Linkup",
    description: "Video calling app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
            <body className={GeistSans.className}>
                {children}
                <Toaster
                    theme="dark"
                    position="top-right"
                    duration={3000}
                    toastOptions={{
                        className: "bg-zinc-900! text-red-400! border! border-red-500/30! shadow-lg!",
                    }}
                />
                <TooltipProvider>{children}</TooltipProvider>
            </body>
        </html>
    );
}
