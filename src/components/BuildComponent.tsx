import React, { useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { MODULES } from "../game/modules/moduleDefinitions";
import type { ModuleDef } from "../game/modules/module.types";

export const BuildComponent: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<ModuleDef>(
    MODULES.habitat,
  );
  const buildModule = useGameStore((state) => state.buildModule);
  const inventory = useGameStore((state) => state.inventory);

  const canAffordModule = selectedModule.buildCost.every((cost) => {
    const stockAvailable = inventory[cost.resource] ?? 0;
    return stockAvailable >= cost.amount;
  });

  const handleTransmitBlueprint = () => {
    if (!canAffordModule) return;
    const runningGame = (window as any).phaserGameInstance;
    if (runningGame) {
      // Triggers your IsoScene's listener loop setup instantly!
      runningGame.events.emit("select-module", selectedModule.id);
    } else {
      console.error(
        "Phaser instance handle not initialized in window state context.",
      );
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* 📋 SIDEBAR MENU */}
      <div className="w-1/3 border-r border-neutral-800 pr-3 overflow-y-auto flex flex-col gap-2">
        {Object.values(MODULES).map((mod) => (
          <button
            key={mod.id}
            onClick={() => setSelectedModule(mod)}
            className={`w-full text-left p-3 rounded border text-xs flex justify-between items-center transition ${
              selectedModule.id === mod.id
                ? "bg-neutral-800 border-orange-500 text-white"
                : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            <span>{mod.name}</span>
            <span className="text-[10px] text-neutral-500 font-mono">
              [{mod.w}x{mod.h}]
            </span>
          </button>
        ))}
      </div>

      {/* 🔍 DETAILED MODULAR INSPECTION PANEL */}
      <div className="w-2/3 flex flex-col justify-between bg-neutral-900/30 p-4 rounded border border-neutral-800 overflow-y-auto">
        <div>
          <h3 className="text-base font-bold text-orange-400">
            {selectedModule.name}
          </h3>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            {selectedModule.description}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] border-t border-neutral-800 pt-3 text-neutral-400">
            <div>
              📐 Footprint:{" "}
              <span className="text-white">
                {selectedModule.w} x {selectedModule.h} Grid
              </span>
            </div>
            <div>
              ⚡ Grid Draw:{" "}
              <span
                className={
                  selectedModule.powerDraw < 0
                    ? "text-red-400"
                    : "text-green-400"
                }
              >
                {selectedModule.powerDraw} EU/h
              </span>
            </div>
            <div>
              🛡️ Structural HP:{" "}
              <span className="text-white">
                {selectedModule.maxIntegrity} Max
              </span>
            </div>
            <div>
              ⚠️ Environmental Decay:{" "}
              <span className="text-white">
                -{selectedModule.baseDecayRate} HP/Sol
              </span>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-[11px] text-neutral-500 uppercase tracking-widest font-bold">
              Blueprint Material Requisites:
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedModule.buildCost.map((cost, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-900 border border-neutral-700 px-3 py-1 rounded text-xs"
                >
                  <span className="capitalize">
                    {cost.resource.replace("_", " ")}
                  </span>
                  : <strong className="text-orange-400">{cost.amount}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={!canAffordModule}
          onClick={handleTransmitBlueprint}
          className={`w-full mt-6 font-bold py-3 px-4 rounded text-xs uppercase tracking-widest shadow-md transition-all duration-150 ${
            canAffordModule
              ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-black cursor-pointer transform hover:scale-[1.01]"
              : "bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed"
          }`}
        >
          {canAffordModule
            ? "🔨 Transmit Blueprint To Grid Map"
            : "❌ LOCKED: Insufficient Stockpile Resources"}
        </button>
      </div>
    </div>
  );
};
