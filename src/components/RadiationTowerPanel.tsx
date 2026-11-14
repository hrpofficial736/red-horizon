import React from "react";
import { MODULES } from "../game/modules/moduleDefinitions";
import {
  RADIATION_DAY_DECAY_PER_SOL,
  RADIATION_NIGHT_DECAY_PER_SOL,
  RADIATION_TOWER_DAY_REDUCTION,
  RADIATION_TOWER_NIGHT_REDUCTION,
} from "../store/useGameStore";

interface RadiationTowerPanelProps {
  instanceId: string;
  onClose: () => void;
}

export const RadiationTowerPanel: React.FC<RadiationTowerPanelProps> = ({
  onClose,
}) => {
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

        <div
          className="rounded border border-green-500/40 bg-green-950/30 px-3 py-2 text-center text-[10px] font-bold uppercase text-green-300"
        >
          RADIATION COVERAGE ACTIVE
        </div>
        <div className="rounded border border-blue-500/30 bg-blue-950/20 px-3 py-2 text-center text-[10px] text-blue-200">
          Decay: day {RADIATION_DAY_DECAY_PER_SOL * 100}%/Sol | night{" "}
          {RADIATION_NIGHT_DECAY_PER_SOL * 100}%/Sol.
          <br />
          Day prevention: {Math.round(RADIATION_TOWER_DAY_REDUCTION * 100)}% |
          Night prevention:{" "}
          {Math.round(RADIATION_TOWER_NIGHT_REDUCTION * 100)}%
        </div>
      </div>
    </div>
  );
};
