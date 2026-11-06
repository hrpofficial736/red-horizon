import React from "react";
import { useGameStore } from "../store/useGameStore";
import { MODULES } from "../game/modules/moduleDefinitions";

interface InspectionOverlayProps {
  clickedModuleData: {
    uid: number;
    id: string;
    col: number;
    row: number;
  } | null;
  onClose: () => void;
}

export const InspectionOverlay: React.FC<InspectionOverlayProps> = ({
  clickedModuleData,
  onClose,
}) => {
  const placedModules = useGameStore((state) => state.placedModules);
  const startActiveRepairLoop = useGameStore(
    (state) => state.startActiveRepairLoop,
  );
  const stopActiveRepairLoop = useGameStore(
    (state) => state.stopActiveRepairLoop,
  );
  const activeRepairInstanceId = useGameStore(
    (state) => state.activeRepairInstanceId,
  );
  const repairKits = useGameStore((state) => state.inventory.repair_kit || 0);
  

  if (!clickedModuleData) return null;

  // Locate the up-to-date live store values using spatial references passed by Phaser's click
  const liveModule = placedModules.find(
    (m) => m.x === clickedModuleData.col && m.y === clickedModuleData.row,
  );
  if (!liveModule) return null;

  const config = MODULES[liveModule.id];
  const maxHp = config ? config.maxIntegrity : 100;
  const displayedHp = Math.round(liveModule.hp);
  const hpPercent = Math.round((liveModule.hp / maxHp) * 100);
  const isCurrentlyRepairing = activeRepairInstanceId === liveModule.instanceId;

  return (
    <div className="absolute top-1/4 left-6 z-50 w-80 bg-neutral-950/95 border border-neutral-800 text-white p-4 rounded-xl font-mono shadow-2xl pointer-events-auto backdrop-blur-md">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-3">
        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
          ⚡ DIAGNOSTIC CORE
        </h3>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-white text-xs bg-neutral-900 px-1.5 py-0.5 rounded cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <span className="text-neutral-400 block text-[10px]">
            DESIGNATION:
          </span>
          <strong className="text-sm text-neutral-200">
            {config?.name || liveModule.id}
          </strong>
        </div>

        <div>
          <span className="text-neutral-400 block text-[10px] mb-1">
            HULL INTEGRITY TRACKER:
          </span>
          <div className="w-full bg-neutral-900 h-2 rounded overflow-hidden border border-neutral-800">
            <div
              className={`h-full transition-all duration-75 ${hpPercent < 30 ? "bg-red-600" : hpPercent < 65 ? "bg-amber-500" : "bg-green-500"}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-1 text-neutral-400">
            <span>
              Status Value: {displayedHp} / {maxHp} HP
            </span>
            <span>{hpPercent}%</span>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-2 flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>Stock Repair Toolkits:</span>
            <strong className="text-white">{repairKits} units</strong>
          </div>

          {/* ✊ REACT UI HOLD BUTTON PATTERN FLOW */}
          <button
            disabled={liveModule.hp >= maxHp || repairKits <= 0}
            onMouseDown={() => startActiveRepairLoop(liveModule.instanceId)}
            onMouseUp={stopActiveRepairLoop}
            onMouseLeave={stopActiveRepairLoop}
            onTouchStart={() => startActiveRepairLoop(liveModule.instanceId)}
            onTouchEnd={stopActiveRepairLoop}
            className={`w-full py-3 text-xs uppercase tracking-widest font-bold rounded select-none ${
              liveModule.hp >= maxHp
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
                : isCurrentlyRepairing
                  ? "bg-red-600 text-white font-bold animate-pulse scale-[0.99]"
                  : "bg-orange-500 text-black font-bold active:scale-95 cursor-pointer"
            }`}
          >
            {liveModule.hp >= maxHp
              ? "🔧 INTEGRITY MAXIMUM"
              : isCurrentlyRepairing
                ? "🛠️ HOLDING WRENCH..."
                : "✊ HOLD TO REPAIR"}
          </button>
        </div>
      </div>
    </div>
  );
};
