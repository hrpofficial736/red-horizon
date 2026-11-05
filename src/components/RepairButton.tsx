import React, { useEffect, useState, useRef } from "react";
import { useGameStore } from "../store/useGameStore";
import { MODULES } from "../game/modules/moduleDefinitions";

interface RepairButtonProps {
  moduleInstance: { id: string; instanceId: string; hp: number };
}

export const RepairButton: React.FC<RepairButtonProps> = ({
  moduleInstance,
}) => {
  // 1. Grab your existing store variables and methods
  const startActiveRepairLoop = useGameStore(
    (state) => state.startActiveRepairLoop,
  );
  const stopActiveRepairLoop = useGameStore(
    (state) => state.stopActiveRepairLoop,
  );
  const getRepairElapsedMinutes = useGameStore(
    (state) => state.getRepairElapsedMinutes,
  );
  const repairKitCount = useGameStore(
    (state) => state.inventory.repair_kit || 0,
  );

  // Local interaction tracking variables
  const [isPressing, setIsPressing] = useState(false);
  const initialElapsedMinutes = getRepairElapsedMinutes(moduleInstance.instanceId);
  const [progress, setProgress] = useState(
    Math.min(100, (initialElapsedMinutes / 60) * 100),
  );
  const [remainingMinutes, setRemainingMinutes] = useState(
    Math.max(0, 60 - initialElapsedMinutes),
  );
  const repairJob = useGameStore((state) => state.repairJobs[moduleInstance.instanceId]);
  const activeRepairInstanceId = useGameStore(
    (state) => state.activeRepairInstanceId,
  );

  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const config = MODULES[moduleInstance.id];
  const maxHp = config ? config.maxIntegrity : 100;
  const isFullyRepaired = moduleInstance.hp >= maxHp;

  const startRepairHold = () => {
    if (
      isFullyRepaired ||
      isPressing ||
      activeRepairInstanceId === moduleInstance.instanceId
    )
      return;

    startActiveRepairLoop(moduleInstance.instanceId);
    if (
      useGameStore.getState().activeRepairInstanceId !==
      moduleInstance.instanceId
    )
      return;
    setIsPressing(true);

    intervalRef.current = setInterval(() => {
      if (
        useGameStore.getState().activeRepairInstanceId !==
        moduleInstance.instanceId
      ) {
        const currentModule = useGameStore
          .getState()
          .placedModules.find(
            (module) => module.instanceId === moduleInstance.instanceId,
          );
        if (currentModule && currentModule.hp >= maxHp) {
          finishRepair();
        } else {
          pauseRepairHold();
        }
        return;
      }

      const elapsedMinutes = getRepairElapsedMinutes(moduleInstance.instanceId);
      const remaining = Math.max(0, 60 - elapsedMinutes);
      setProgress(Math.min(100, (elapsedMinutes / 60) * 100));
      setRemainingMinutes(remaining);

      if (elapsedMinutes >= 60) {
        finishRepair();
      }
    }, 100);
  };

  const pauseRepairHold = () => {
    stopActiveRepairLoop();
    const elapsedMinutes = getRepairElapsedMinutes(moduleInstance.instanceId);
    setRemainingMinutes(Math.max(0, 60 - elapsedMinutes));
    setProgress(Math.min(100, (elapsedMinutes / 60) * 100));
    setIsPressing(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const finishRepair = () => {
    setIsPressing(false);
    setProgress(100);
    setRemainingMinutes(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopActiveRepairLoop();
    },
    [moduleInstance.instanceId, stopActiveRepairLoop],
  );

  return (
    <div className="flex flex-col items-center justify-between bg-neutral-900/90 border border-neutral-800 rounded-lg select-none">
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
      <div className="text-center text-xs font-bold text-orange-300">
        {isPressing
          ? `${String(Math.floor(remainingMinutes / 60)).padStart(2, "0")}:${String(
              remainingMinutes % 60,
            ).padStart(2, "0")} REMAINING`
          : "REPAIR TIME 01:00"}
      </div>

      {/* INTERACTIVE HOLD TO WRENCH FIX CONTROLLER BUTTON */}
      <button
        disabled={isFullyRepaired || (!repairJob && repairKitCount < 1)}
        onMouseDown={startRepairHold}
        onMouseUp={pauseRepairHold}
        onMouseLeave={pauseRepairHold}
        onTouchStart={startRepairHold} // Native touch gesture mappings for mobile devices
        onTouchEnd={pauseRepairHold}
        className={`relative overflow-hidden px-4 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded min-w-[150px] transition-all duration-100 ${
          isFullyRepaired
            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
            : repairKitCount < 1 && !repairJob
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
