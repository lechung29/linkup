/** @format */

"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!globalSocket) {
            globalSocket = io({
                path: "/api/socket",
                addTrailingSlash: false,
            });
        }
        if (globalSocket.connected) {
            setSocket(globalSocket);
        }

        const onConnect = () => setSocket(globalSocket);
        globalSocket.on("connect", onConnect);

        setSocket(globalSocket);

        return () => {
            globalSocket?.off("connect", onConnect);
        };
    }, []);

    return socket;
}
