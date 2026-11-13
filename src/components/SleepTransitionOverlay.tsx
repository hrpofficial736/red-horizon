import { FileText, RefreshCw } from "lucide-react";
import {
  RADIATION_WAVE_INTERVAL_DAYS,
  useGameStore,
} from "../store/useGameStore";

export function SleepTransitionOverlay() {
  const phase = useGameStore((state) => state.sleepOverlayPhase);
  const nextDay = useGameStore((state) => state.sleepOverlayDay);
  const overlayMode = useGameStore((state) => state.sleepOverlayMode);
  const currentDay = useGameStore((state) => state.currentDay);
  const lastRadiationWaveDay = useGameStore(
    (state) => state.lastRadiationWaveDay,
  );

  if (phase === "none") return null;

  const isBlack = phase !== "fadeIn";
  const nextRadiationDay = lastRadiationWaveDay + RADIATION_WAVE_INTERVAL_DAYS;
  const daysUntilRadiation = Math.max(0, nextRadiationDay - currentDay);
  const countdownFill = Math.min(
    100,
    (daysUntilRadiation / RADIATION_WAVE_INTERVAL_DAYS) * 100,
  );

  return (
    <div
      className={`pointer-events-auto fixed inset-0 z-100 flex items-center justify-center bg-black transition-opacity duration-700 ${
        isBlack ? "opacity-100" : "opacity-0"
      }`}
      aria-live="polite"
    >
      <div
        className={`text-center transition-opacity duration-500 ${
          phase === "day" ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="font-orbitron font-medium text-xs uppercase tracking-[0.35em] text-neutral-500">
          New day
        </p>
        <p className="mt-3 font-orbitron text-6xl font-bold tracking-widest text-white">
          SOL {String(nextDay).padStart(2, "0")}
        </p>
      </div>
      <span className="absolute bottom-8 right-7 text-[10px] uppercase tracking-widest text-white animate-pulse">
        {overlayMode === "load" ? (
          <RefreshCw size={32} strokeWidth={1.5} className="animate-spin" />
        ) : (
          <FileText size={32} strokeWidth={1.5} />
        )}
      </span>
      <div
        className="absolute bottom-6 right-18 flex flex-row-reverse items-end gap-2 rounded-none border-0 border-yellow-900/70 bg-black/80 px-3 py-2 text-yellow-400"
        aria-label={`${daysUntilRadiation} days until next radiation event`}
      >
        <div className="flex flex-row items-center gap-0 h-full">
          <div className="flex h-10 w-2 items-end overflow-hidden border border-yellow-700/80 bg-yellow-950/60">
            <div
              className="w-full bg-yellow-400 transition-[height] duration-500"
              style={{ height: `${countdownFill}%` }}
            />
          </div>
          <div className="flex flex-row min-w-14 bg-gray-50/10 h-10 items-center justify-center rounded-tr-none rounded-br-none">
            <p className="text-lg font-bold leading-none">
              {daysUntilRadiation}
            </p>
            <p className="text-lg uppercase font-bold tracking-[0.18em] leading-none text-yellow-500">
              D
            </p>
          </div>
        </div>
        <p className="mt-1 max-w-15 text-right text-[9px] uppercase tracking-widest text-yellow-200">
          next radiation
        </p>
      </div>
    </div>
  );
}
