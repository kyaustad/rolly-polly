"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const name = playerName.trim() || "Captain";
    setCreating(true);
    setError("");
    const { getSocket } = await import("@/lib/socket");
    const socket = getSocket();
    if (!socket) {
      setError("Connection not available");
      setCreating(false);
      return;
    }
    socket.emit("create_room", name, (res: { code?: string; error?: string }) => {
      setCreating(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      if (res?.code) router.push(`/room/${res.code}?name=${encodeURIComponent(name)}`);
    });
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    const name = playerName.trim() || "Crew";
    if (!code) {
      setError("Enter a room code");
      return;
    }
    setJoining(true);
    setError("");
    const { getSocket } = await import("@/lib/socket");
    const socket = getSocket();
    if (!socket) {
      setError("Connection not available");
      setJoining(false);
      return;
    }
    socket.emit("join_room", { code, playerName: name }, (res: { code?: string; error?: string }) => {
      setJoining(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      if (res?.code) router.push(`/room/${res.code}?name=${encodeURIComponent(name)}`);
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-950/30 via-stone-950 to-stone-950 text-stone-100">
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-16">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-amber-200/95 drop-shadow-sm sm:text-4xl">
            Rolly Polly
          </h1>
          <p className="mt-2 text-sm text-stone-400 sm:text-base">
            Multiplayer d6 dice for Scum & Villainy and other TTRPGs
          </p>
        </header>

        <div className="space-y-6 rounded-2xl border border-amber-900/40 bg-stone-900/60 p-4 shadow-xl sm:p-6">
          <div>
            <label className="block text-sm font-medium text-amber-200/80 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Captain or crew name"
              className="min-h-[48px] w-full touch-manipulation rounded-lg border border-stone-600 bg-stone-800/80 px-4 py-2.5 text-base text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:min-h-0"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="min-h-[48px] touch-manipulation rounded-xl border border-amber-600/60 bg-amber-800/40 px-4 py-3 font-medium text-amber-100 transition active:bg-amber-700/50 hover:bg-amber-700/50 disabled:opacity-60 sm:min-h-0"
            >
              {creating ? "Creating…" : "Create game"}
            </button>
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="min-h-[48px] touch-manipulation rounded-xl border border-stone-600 bg-stone-800/60 px-4 py-3 font-medium text-stone-200 transition active:bg-stone-700/60 hover:bg-stone-700/60 disabled:opacity-60 sm:min-h-0"
            >
              {joining ? "Joining…" : "Join game"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-stone-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-stone-900/60 px-2 text-stone-500">Join with code</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={6}
              className="min-h-[48px] flex-1 touch-manipulation rounded-lg border border-stone-600 bg-stone-800/80 px-4 py-2.5 text-base text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase sm:min-h-0"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || !joinCode.trim()}
              className="min-h-[48px] touch-manipulation shrink-0 rounded-lg bg-amber-700/60 px-4 py-2.5 font-medium text-amber-100 active:bg-amber-600/60 hover:bg-amber-600/60 disabled:opacity-50 sm:min-h-0"
            >
              Join
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-stone-500 sm:mt-8">
          Roll 1–6 d6s together. Perfect for Forged in the Dark–style pools.
        </p>
      </div>
    </div>
  );
}
