/** @format */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import connectDB from "./mongodb";
import User from "@/models/user";

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            try {
                await connectDB();

                const existingUser = await User.findOne({ email: user.email });
                if (existingUser) {
                    await User.findOneAndUpdate({ email: user.email }, { lastLoginAt: new Date() });
                } else {
                    await User.create({
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        provider: account?.provider,
                    });
                }

                return true;
            } catch (error) {
                console.error("Error saving user:", error);
                return false;
            }
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
            }
            return session;
        },

        async jwt({ token, profile }) {
            if (profile) {
                token.sub = token.sub ?? profile.sub ?? undefined;
            }
            return token;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 365 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },
});
