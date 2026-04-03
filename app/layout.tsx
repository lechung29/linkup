/** @format */

import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";

export const metadata: Metadata = {
    title: "Linkup",
    description: "Video calling app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
            <body className={GeistSans.className}>
                {children}
                <Toaster theme="dark" position="top-center" />
            </body>
        </html>
    );
}
