/** @format */

import { create } from "zustand";

interface RoomStore {
    pinnedIdentities: string[];
    setPinnedIdentities: (ids: string[] | ((prev: string[]) => string[])) => void;
    togglePinned: (identity: string, allIdentities: string[]) => void;

    startedAt: number | null;
    setStartedAt: (t: number | null) => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
    pinnedIdentities: [],
    setPinnedIdentities: (ids) => {
        if (typeof ids === "function") {
            set({ pinnedIdentities: ids(get().pinnedIdentities) });
        } else {
            set({ pinnedIdentities: ids });
        }
    },
    togglePinned: (identity, allIdentities) => {
        const current = get().pinnedIdentities;
        const exists = current.includes(identity);
        if (exists) {
            const removed = current.filter((id) => id !== identity);
            const next = allIdentities.find((id) => !removed.includes(id) && id !== identity);
            set({ pinnedIdentities: next ? [...removed, next] : removed });
        } else {
            const updated = current.length >= 8 ? [...current.slice(0, 7), identity] : [...current, identity];
            set({ pinnedIdentities: updated });
        }
    },

    startedAt: null,
    setStartedAt: (t) => set({ startedAt: t }),
}));
