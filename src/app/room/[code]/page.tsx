"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSocket, type RollEvent, type Player } from "@/lib/socket";
import { DiceScene } from "@/components/dice/DiceScene";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = (params?.code as string) || "";
  const nameFromQuery = searchParams?.get("name") || "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [rolls, setRolls] = useState<RollEvent[]>([]);
  const [numDice, setNumDice] = useState(3);
  const [triggerRoll, setTriggerRoll] = useState(0);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const joinSent = useRef(false);
  const myIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onRoomJoined = (data: { players: Player[]; id?: string }) => {
      myIdRef.current = data.id ?? null;
      setPlayers(data.players);
      setJoined(true);
    };
    const onPlayerJoined = (data: {
      id: string;
      name: string;
      total: number;
      players?: Player[];
    }) => {
      if (Array.isArray(data.players)) {
        const myId = myIdRef.current;
        setPlayers(
          data.players.map((p) => ({ ...p, you: myId != null && p.id === myId }))
        );
      } else {
        setPlayers((prev) => {
          if (prev.some((p) => p.id === data.id)) return prev;
          return [...prev, { id: data.id, name: data.name }];
        });
      }
    };
    const onPlayerLeft = (data: {
      id: string;
      total: number;
      players?: Player[];
    }) => {
      if (Array.isArray(data.players)) {
        const myId = myIdRef.current;
        setPlayers(
          data.players.map((p) => ({ ...p, you: myId != null && p.id === myId }))
        );
      } else {
        setPlayers((prev) => prev.filter((p) => p.id !== data.id));
      }
    };
    const onRoll = (roll: RollEvent) => {
      setRolls((prev) => [roll, ...prev].slice(0, 50));
    };

    socket.on("connect", onConnect);
    socket.on("room_joined", onRoomJoined);
    socket.on("player_joined", onPlayerJoined);
    socket.on("player_left", onPlayerLeft);
    socket.on("roll", onRoll);
    setConnected(socket.connected);

    if (!joinSent.current) {
      joinSent.current = true;
      socket.emit(
        "join_room",
        { code: code.toUpperCase(), playerName: nameFromQuery || "Crew" },
        (res: { error?: string }) => {
          if (res?.error) {
            setJoined(false);
          }
        }
      );
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("room_joined", onRoomJoined);
      socket.off("player_joined", onPlayerJoined);
      socket.off("player_left", onPlayerLeft);
      socket.off("roll", onRoll);
    };
  }, [code, nameFromQuery]);

  const handleRollComplete = useCallback(
    (results: number[]) => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("roll", { numDice: results.length, results });
      }
    },
    []
  );

  const handleRollClick = useCallback(() => {
    setTriggerRoll((n) => n + 1);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-950/20 via-stone-950 to-stone-950 text-stone-100">
      <header className="border-b border-amber-900/30 bg-stone-900/40 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-amber-200/80 hover:text-amber-200"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-4">
            <span className="rounded-lg bg-amber-900/40 px-3 py-1.5 font-mono text-sm font-medium text-amber-200">
              {code || "…"}
            </span>
            <span className="text-sm text-stone-400">
              {players.length} player{players.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          <section>
            <DiceScene
              numDice={numDice}
              triggerRoll={triggerRoll}
              onRollComplete={handleRollComplete}
              disabled={!joined}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="numDice" className="text-sm text-stone-400">
                  Dice
                </label>
                <select
                  id="numDice"
                  value={numDice}
                  onChange={(e) => setNumDice(Number(e.target.value))}
                  className="rounded-lg border border-stone-600 bg-stone-800/80 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}d6
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleRollClick}
                disabled={!joined}
                className="rounded-xl bg-amber-600 px-5 py-2.5 font-medium text-white shadow-lg transition hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600"
              >
                Roll
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-amber-900/30 bg-stone-900/50 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-200/80">
                Players
              </h2>
              <ul className="space-y-1.5">
                {players.length === 0 && (
                  <li className="text-sm text-stone-500">No one here yet.</li>
                )}
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 text-sm text-stone-200"
                  >
                    <span
                      className="h-2 w-2 rounded-full bg-amber-500/80"
                      aria-hidden
                    />
                    {p.name}
                    {p.you && (
                      <span className="text-xs text-amber-400/80">(you)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-900/30 bg-stone-900/50 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-200/80">
                Roll log
              </h2>
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
                {rolls.length === 0 && (
                  <li className="text-stone-500">Rolls appear here.</li>
                )}
                {rolls.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-baseline justify-between gap-2 rounded-lg bg-stone-800/50 px-2.5 py-1.5"
                  >
                    <span className="font-medium text-amber-200/90 truncate">
                      {r.playerName}
                    </span>
                    <span className="font-mono text-stone-300 shrink-0">
                      {r.results.join(",")} → {r.results.reduce((a, b) => a + b, 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
