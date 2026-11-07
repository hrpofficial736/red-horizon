import React from "react";
import {
  getPowerBankCapacity,
  useGameStore,
} from "../store/useGameStore";

export const BaseStatusHUD: React.FC = () => {
  const currentDay = useGameStore((state) => state.currentDay);
  const currentHour = useGameStore((state) => state.currentHour);
  const currentMinute = useGameStore((state) => state.currentMinute);
  const astronautHealth = useGameStore((state) => state.astronautHealth);
  const fatigueLevel = useGameStore((state) => state.fatigueLevel);
  const sleepUntilMorning = useGameStore((state) => state.sleepUntilMorning);
  const workOvertime = useGameStore((state) => state.workOvertime);
  const overtimeHours = useGameStore((state) => state.overtimeHours);
  const isFainted = useGameStore((state) => state.isFainted);
  const repairKitCount = useGameStore(
    (state) => state.inventory.repair_kit || 0,
  );
  const ironPlateCount = useGameStore(
    (state) => state.inventory.iron_plate || 0,
  );
  const glassPanelCount = useGameStore(
    (state) => state.inventory.glass_panel || 0,
  );
  const soupCount = useGameStore((state) => state.inventory.soup || 0);
  const powerBankCharge = useGameStore((state) => state.powerBankCharge);
  const placedModules = useGameStore((state) => state.placedModules);
  const powerBankCapacity = getPowerBankCapacity(placedModules);
  const formattedHour = String(currentHour).padStart(2, "0");
  const formattedMinute = String(currentMinute).padStart(2, "0");

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
          <span className="text-orange-400 font-bold tracking-wider">
            Sol {String(currentDay).padStart(2, "0")} // {formattedHour}:
            {formattedMinute}
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
        <div className="flex justify-between">
          <span className="text-neutral-400">POWER BANK:</span>
          <span
            className={`font-bold ${
              powerBankCapacity > 0 && powerBankCharge / powerBankCapacity < 0.2
                ? "text-red-400"
                : "text-green-400"
            }`}
          >
            {Math.round(powerBankCharge)} / {powerBankCapacity} EU
          </span>
        </div>
        {currentHour >= 21 && currentHour < 23 && (
          <div className="border-t border-neutral-800 pt-2 mt-2 space-y-1.5">
            <div className="text-[10px] text-amber-300">
              TIRED WINDOW: {overtimeHours}/2 overtime hours
            </div>
            <button
              onClick={sleepUntilMorning}
              className="w-full rounded border border-green-700 bg-green-950/60 px-2 py-1.5 text-[10px] font-bold text-green-300 hover:bg-green-900"
            >
              SLEEP NOW
            </button>
            <button
              onClick={workOvertime}
              className="w-full rounded border border-orange-700 bg-orange-950/60 px-2 py-1.5 text-[10px] font-bold text-orange-300 hover:bg-orange-900"
            >
              WORK 1 MORE HOUR
            </button>
          </div>
        )}
        {isFainted && (
          <div className="border-t border-neutral-800 pt-2 mt-2 text-center text-[10px] font-bold text-red-400">
            FAINTED FROM EXHAUSTION
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-800 pt-2 mt-2">
          <span className="text-neutral-400">REPAIR KITS:</span>
          <span className="text-white font-bold">{repairKitCount} units</span>
        </div>
      </div>
    </div>
  );
};
