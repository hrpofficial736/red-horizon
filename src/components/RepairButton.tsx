import React, { useState, useRef } from "react";
import { useGameStore } from "../store/useGameStore";
import { MODULES } from "../game/modules/moduleDefinitions";

interface RepairButtonProps {
  moduleInstance: { id: string; instanceId: string; hp: number };
}

export const RepairButton: React.FC<RepairButtonProps> = ({
  moduleInstance,
}) => {
  // 1. Grab your existing store variables and methods
  const repairModule = useGameStore((state) => state.repairModule);
  const advanceHour = useGameStore((state) => state.advanceHour);
  const repairKitCount = useGameStore(
    (state) => state.inventory.repair_kit || 0,
  );

  // Local interaction tracking variables
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout>>(null);

  const config = MODULES[moduleInstance.id];
  const maxHp = config ? config.maxIntegrity : 100;
  const isFullyRepaired = moduleInstance.hp >= maxHp;

  // Triggers the exact moment the user presses down on the button grid item
  const startRepairHold = () => {
    if (isFullyRepaired || repairKitCount < 1) return;

    setIsPressing(true);
    setProgress(0);

    // Loop A: The Visual Progress Bar Tick (Updates every 20ms to fill over 1 Second)
    const tickIntervalTime = 20;
    let currentProgress = 0;

    intervalRef.current = setInterval(() => {
      currentProgress += (tickIntervalTime / 1000) * 100;
      if (currentProgress >= 100) {
        setProgress(100);
        clearInterval(intervalRef.current!);
      } else {
        setProgress(currentProgress);
      }
    }, tickIntervalTime);

    // Loop B: The Action Trigger Execution (Fires once user holds for a solid 1000ms)
    timerRef.current = setTimeout(() => {
      // 1. Execute your existing repair action loop!
      const wasRepaired = repairModule(moduleInstance.instanceId);

      if (wasRepaired) {
        // 2. 🕒 RUN TIME FAST-FORWARD: Progresses your core environment systems by 1 hour!
        // This forces production loops and midnight decay math checks to compute naturally
        advanceHour(1);

        console.log(
          `🔧 Maintenance complete. 1 Game Hour spent patching ${moduleInstance.id}.`,
        );
      }

      cancelRepairHold();
    }, 1000);
  };

  // Safely stops and clears timers if the user releases the mouse or drags away early
  const cancelRepairHold = () => {
    setIsPressing(false);
    setProgress(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg select-none font-mono">
      <div>
        <h4 className="text-sm font-bold text-white">
          {config?.name || moduleInstance.id}
        </h4>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          Integrity:{" "}
          <span
            className={
              moduleInstance.hp < 30
                ? "text-red-500 font-bold"
                : "text-neutral-200"
            }
          >
            {moduleInstance.hp} / {maxHp} HP
          </span>
        </p>
      </div>

      {/* INTERACTIVE HOLD TO WRENCH FIX CONTROLLER BUTTON */}
      <button
        disabled={isFullyRepaired || repairKitCount < 1}
        onMouseDown={startRepairHold}
        onMouseUp={cancelRepairHold}
        onMouseLeave={cancelRepairHold}
        onTouchStart={startRepairHold} // Native touch gesture mappings for mobile devices
        onTouchEnd={cancelRepairHold}
        className={`relative overflow-hidden px-4 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded min-w-[150px] transition-all duration-100 ${
          isFullyRepaired
            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
            : repairKitCount < 1
              ? "bg-red-950/20 text-red-500 border border-red-900/40 cursor-not-allowed"
              : "bg-orange-500 text-black active:scale-95 cursor-pointer"
        }`}
      >
        {/* Dynamic visual loading progression slider background background overlay fill */}
        {isPressing && (
          <div
            className="absolute inset-y-0 left-0 bg-orange-600 transition-all ease-linear"
            style={{ width: `${progress}%`, zIndex: 0 }}
          />
        )}

        <span className="relative z-10 pointer-events-none">
          {isFullyRepaired
            ? "🔧 NOMINAL"
            : isPressing
              ? "🛠️ REPAIRING..."
              : "✊ HOLD TO REPAIR"}
        </span>
      </button>
    </div>
  );
};
