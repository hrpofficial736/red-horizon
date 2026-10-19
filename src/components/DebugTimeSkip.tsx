import React, { useState } from "react";
import { useGameStore } from "../store/useGameStore";

export const DebugTimeSkip: React.FC = () => {
  const [isSkipping, setIsSkipping] = useState(false);
  const startPassiveTimer = useGameStore((state) => state.startPassiveTimer);
  const stopPassiveTimer = useGameStore((state) => state.stopPassiveTimer);

  const handleSkipToNight = () => {
    if (isSkipping) return;
    setIsSkipping(true);

    // 1. Halt your slow background passive interval clock immediately
    stopPassiveTimer();

    console.log(
      "🚀 Debug Mode: Accelerating base timeline parameters to test night-time decay...",
    );

    // 2. Continuous time injection: steps 1 hour forward every 150ms over a 12-hour block
    let hoursStepped = 0;
    const skipInterval = setInterval(() => {
      const store = useGameStore.getState();

      // Advance by 1 full game hour
      store.advanceHour(1);
      hoursStepped++;

      // Once a full 12-hour cycle finishes, clear the loop and restore passive time
      if (hoursStepped >= 12) {
        clearInterval(skipInterval);
        startPassiveTimer(); // Reboot normal time ticking
        setIsSkipping(false);
        console.log(
          "🔒 Debug Skip Complete: Normal background timeline simulation restored.",
        );
      }
    }, 150);
  };

  return (
    <div className="absolute bottom-28 right-4 z-50 pointer-events-auto">
      <button
        disabled={isSkipping}
        onClick={handleSkipToNight}
        className={`px-4 py-2.5 rounded-lg border-2 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-2xl select-none ${
          isSkipping
            ? "bg-red-950/40 border-red-900 text-red-500 animate-pulse cursor-not-allowed"
            : "bg-neutral-950 border-orange-500/60 text-orange-400 hover:border-orange-400 hover:bg-neutral-900 cursor-pointer active:scale-95"
        }`}
      >
        {isSkipping ? "⏩ TIME ACCELERATING..." : "⏩ DEBUG: SKIP 12 HOURS"}
      </button>
    </div>
  );
};
