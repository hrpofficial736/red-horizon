import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "../store/useGameStore";

export function DustStormAlert() {
  const currentDay = useGameStore((state) => state.currentDay);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || currentDay < 10 || currentDay > 18) {
    return null;
  }

  return (
    <aside
      className="pointer-events-auto absolute left-4 top-4 z-30 w-72 rounded-xl border border-amber-500/60 bg-neutral-950/95 p-4 text-amber-100 shadow-2xl backdrop-blur"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-400" size={22} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-orbitron text-xs font-bold uppercase tracking-widest text-amber-300">
              Dust Storm Alert
            </p>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss dust storm alert"
              title="Dismiss alert"
              className="rounded p-0.5 text-amber-300/70 transition hover:bg-amber-500/20 hover:text-amber-100"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-100/85">
            A dust storm is affecting Outpost Alpha from Sol 10 to Sol 18.
            Solar array efficiency is reduced by 10% during the storm.
          </p>
        </div>
      </div>
    </aside>
  );
}
