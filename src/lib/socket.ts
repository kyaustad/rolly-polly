"use client";

import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001")
    : "";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true });
  }
  return socket;
}

export type RollEvent = {
  id: string;
  playerId: string;
  playerName: string;
  numDice: number;
  results: number[];
  at: number;
};

export type Player = { id: string; name: string; you?: boolean };
