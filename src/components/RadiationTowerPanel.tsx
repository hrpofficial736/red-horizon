import React from "react";
import { useGameStore } from "../store/useGameStore";
import { MAT_IMPORTS } from "../game/utils/materialsTexture";
import { MODULES } from "../game/modules/moduleDefinitions";

interface RadiationTowerPanelProps {
  instanceId: string;
  onClose: () => void;
}

export const RadiationTowerPanel: React.FC<RadiationTowerPanelProps> = ({
  instanceId,
  onClose,
}) => {
  const queue = useGameStore(
    (state) => state.radiationTowerQueues[instanceId] || 0,
  );
  const inventoryFilters = useGameStore(
    (state) => state.inventory.radiation_filter || 0,
  );
  const autoFill = useGameStore(
    (state) => state.radiationTowerAutoFill[instanceId] || false,
  );
  const loadFilterToTower = useGameStore((state) => state.loadFilterToTower);
  const setAutoFill = useGameStore(
    (state) => state.setRadiationTowerAutoFill,
  );
  const config = MODULES.radiation_tower;

  return (
    <div className="absolute top-1/4 left-8 z-50 w-76 bg-neutral-950/95 border-2 border-neutral-800 text-white p-4 rounded-xl font-mono shadow-2xl pointer-events-auto flex flex-col backdrop-blur-md">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-3">
        <span className="text-red-400 font-bold text-xs uppercase tracking-wider">
          ☢️ RADIATION SHIELD CONTROL
        </span>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-white cursor-pointer text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <strong className="text-sm text-white">{config.name}</strong>
          <p className="text-neutral-400 mt-1 leading-relaxed">
            {config.description}
          </p>
        </div>

        <div className="border-t border-neutral-800 pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-neutral-400 uppercase text-[10px]">
              Filter Slots
            </span>
            <span className="text-white font-bold">{queue} / 3 loaded</span>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((slot) => (
              <button
                key={slot}
                disabled={queue >= 3 || inventoryFilters < 1}
                onClick={() => loadFilterToTower(instanceId)}
                className={`flex-1 h-14 rounded border flex flex-col items-center justify-center ${
                  slot < queue
                    ? "border-red-400 bg-red-950/50"
                    : "border-neutral-700 bg-neutral-900"
                } disabled:cursor-not-allowed`}
              >
                {slot < queue ? (
                  <img
                    src={MAT_IMPORTS.radiation_filter}
                    alt="Loaded radiation filter"
                    className="w-7 h-7 object-contain"
                  />
                ) : (
                  <span className="text-neutral-600 text-lg">+</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] mt-2 text-neutral-500">
            <span>Inventory: {inventoryFilters}</span>
            <span>Drain time: {String(queue * 4).padStart(2, "0")}:00</span>
          </div>
        </div>

        <button
          onClick={() => setAutoFill(instanceId, !autoFill)}
          className={`w-full rounded border px-3 py-2 text-left text-[10px] font-bold uppercase ${
            autoFill
              ? "border-green-500/60 bg-green-950/40 text-green-300"
              : "border-neutral-700 bg-neutral-900 text-neutral-400"
          }`}
        >
          Automatic filter adder: {autoFill ? "ON" : "OFF"}
        </button>

        <div
          className={`rounded border px-3 py-2 text-center text-[10px] font-bold uppercase ${
            queue > 0
              ? "border-green-500/40 bg-green-950/30 text-green-300"
              : "border-amber-500/40 bg-amber-950/30 text-amber-300"
          }`}
        >
          {queue > 0 ? "BASE SHIELD ACTIVE" : "LOAD FILTERS TO ACTIVATE"}
        </div>
      </div>
    </div>
  );
};
