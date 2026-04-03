/** @format */

import { FloatingShape } from "@/components/auth/floatingShape";
import { OrbItem } from "@/components/auth/orbItem";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session) redirect("/login");
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#080b14]">
            <OrbItem size={600} x="10%" y="15%" color="rgba(99,70,255,0.15)" duration={18} />
            <OrbItem size={400} x="70%" y="60%" color="rgba(56,182,255,0.1)" duration={22} delay={3} />
            <OrbItem size={300} x="60%" y="5%" color="rgba(255,99,150,0.08)" duration={26} delay={6} />
            <OrbItem size={250} x="5%" y="70%" color="rgba(70,255,180,0.07)" duration={20} delay={9} />

            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    zIndex: 1,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            <div
                className="fixed inset-0 pointer-events-none opacity-60"
                style={{
                    zIndex: 1,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                    backgroundSize: "200px",
                }}
            />

            <FloatingShape shape="ring" x="8%" y="20%" size={80} opacity={0.12} duration={14} />
            <FloatingShape shape="triangle" x="88%" y="30%" size={50} opacity={0.1} duration={17} delay={2} />
            <FloatingShape shape="ring" x="85%" y="75%" size={120} opacity={0.08} duration={20} delay={5} />
            <FloatingShape shape="dot" x="15%" y="80%" size={8} opacity={0.3} duration={12} delay={1} />
            <FloatingShape shape="dot" x="92%" y="15%" size={5} opacity={0.25} duration={15} delay={4} />
            <FloatingShape shape="cross" x="50%" y="88%" size={30} opacity={0.1} duration={16} delay={7} />

            {children}
        </div>
    );
}
