import { AlertTriangle } from "lucide-react";

interface GameFailureOverlayProps {
    cause: string;
    onLoadGame: () => void;
    onNewGame: () => void;
    success?: boolean;
}

export function GameFailureOverlay({
    cause,
    onLoadGame,
    onNewGame,
    success = false,
}: GameFailureOverlayProps) {
    return (
      <div className="absolute inset-0 z-70 flex items-center justify-center bg-black p-4 text-white">
        <section
          className={`game-failure-message flex flex-col items-center w-full rounded-2xl border-0 bg-neutral-950/0 p-6 text-center shadow-2xl ${
            success ? "border-emerald-500/50" : "border-red-500/50"
          }`}
        >
          {success ? (
            <div className="mx-auto mb-4 text-emerald-400 text-4xl">✓</div>
          ) : (
            <AlertTriangle className="mx-auto mb-4 text-red-400" size={58} />
          )}
          <p
            className={`text-[14px] tracking-[0.3em] ${
              success ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {success
              ? "HORIZON-1 STATUS // EVACUATION SUCCESSFUL"
              : "OUTPOST STATUS // CRITICAL FAILURE"}
          </p>
          <h1 className="mt-2 text-6xl font-bold uppercase tracking-widest font-orbitron">
            {success ? "Mission Successful" : "Mission Failed"}
          </h1>
          <p
            className={`mt-5 border p-4 text-left text-sm leading-relaxed max-w-xl ${
              success
                ? "border-emerald-500/20 bg-emerald-950/30 text-emerald-100"
                : "border-red-500/20 bg-red-950/30 text-red-100"
            }`}
          >
            {cause}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {!success && (
              <button
                type="button"
                onClick={onLoadGame}
                className="rounded-none border border-cyan-400/50 bg-cyan-500/15 px-5 py-3 text-xs font-bold uppercase tracking-widest text-cyan-200 hover:bg-cyan-500/25"
              >
                Load Game
              </button>
            )}
            <button
              type="button"
              onClick={onNewGame}
              className="rounded-none border border-neutral-700 bg-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-widest text-neutral-300 hover:bg-neutral-800"
            >
              New Game
            </button>
          </div>
        </section>
      </div>
    );
}
