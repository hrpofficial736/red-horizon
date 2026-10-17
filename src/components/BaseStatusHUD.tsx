import React from "react";
import { useGameStore } from "../store/useGameStore";

export const BaseStatusHUD: React.FC = () => {
  const currentDay = useGameStore((state) => state.currentDay);
  const currentHour = useGameStore((state) => state.currentHour);
  const astronautHealth = useGameStore((state) => state.astronautHealth);
  const fatigueLevel = useGameStore((state) => state.fatigueLevel);
  const repairKitCount = useGameStore(
    (state) => state.inventory.repair_kit || 0,
  );

  const healthColor =
    astronautHealth < 30
      ? "text-red-500 font-bold"
      : "text-green-400 font-bold";

  return (
    <div className="absolute top-4 right-4 z-20 bg-neutral-950/90 border border-neutral-800 text-white p-4 rounded-xl font-mono min-w-[240px] backdrop-blur shadow-2xl pointer-events-auto">
      <h3 className="text-xs font-bold tracking-widest text-orange-400 border-b border-neutral-800 pb-2 mb-2 uppercase">
        🚀 CONSOLE UPLINK
      </h3>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-neutral-400">SOL TIME:</span>
          <span>
            Sol {String(currentDay).padStart(2, "0")} //{" "}
            {String(currentHour).padStart(2, "0")}:00
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">VITALS HP:</span>
          <span className={healthColor}>{astronautHealth}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">EXHAUSTION:</span>
          <span className="text-amber-400 font-bold">{fatigueLevel} / 100</span>
        </div>
        <div className="flex justify-between border-t border-neutral-800 pt-2 mt-2">
          <span className="text-neutral-400">MAINTENANCE KITS:</span>
          <span className="text-white font-bold">{repairKitCount} units</span>
        </div>
      </div>
    </div>
  );
};
