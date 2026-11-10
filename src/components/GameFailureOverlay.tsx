import { AlertTriangle } from "lucide-react";

interface GameFailureOverlayProps {
  cause: string;
  onLoadGame: () => void;
  onNewGame: () => void;
}

export function GameFailureOverlay({
  cause,
  onLoadGame,
  onNewGame,
}: GameFailureOverlayProps) {
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 font-mono text-white">
      <section className="w-full max-w-lg rounded-2xl border border-red-500/50 bg-neutral-950/95 p-6 text-center shadow-2xl">
        <AlertTriangle className="mx-auto mb-4 text-red-400" size={42} />
        <p className="text-[10px] tracking-[0.3em] text-red-400">
          OUTPOST STATUS // CRITICAL FAILURE
        </p>
        <h1 className="mt-2 text-2xl font-bold uppercase tracking-widest">
          Mission Failed
        </h1>
        <p className="mt-5 border border-red-500/20 bg-red-950/30 p-4 text-left text-sm leading-relaxed text-red-100">
          {cause}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onLoadGame}
            className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-5 py-3 text-xs font-bold uppercase tracking-widest text-cyan-200 hover:bg-cyan-500/25"
          >
            Load Game
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-widest text-neutral-300 hover:bg-neutral-800"
          >
            New Game
          </button>
        </div>
      </section>
    </div>
  );
}
