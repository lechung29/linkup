/** @format */

import { create } from "zustand";
import { Session } from "next-auth";

interface AppState {
    session: Session | null;
    setSession: (session: Session | null) => void;

    currentRoomId: string | null;
    setCurrentRoomId: (id: string | null) => void;

    isChatOpen: boolean;
    toggleChat: () => void;

    isParticipantsOpen: boolean;
    toggleParticipants: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    session: null,
    setSession: (session) => set({ session }),

    currentRoomId: null,
    setCurrentRoomId: (id) => set({ currentRoomId: id }),

    isChatOpen: false,
    toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

    isParticipantsOpen: false,
    toggleParticipants: () => set((state) => ({ isParticipantsOpen: !state.isParticipantsOpen })),
}));
