import { useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { MODULES } from "../game/modules/moduleDefinitions";
import { TEXTURE_IMPORTS } from "../game/utils/textureImports";
import gridIcon from "../assets/Grid.png";
import type { ModuleDef } from "../game/modules/module.types";
import { Lock } from "lucide-react";
import { MAT_IMPORTS } from "../game/utils/materialsTexture";

export const BuildComponent = ({ closeTab }: { closeTab: () => void }) => {
  const [selectedModule, setSelectedModule] = useState<ModuleDef>(
    MODULES.greenhouse,
  );
  const inventory = useGameStore((state) => state.inventory);
  const placedModules = useGameStore((state) => state.placedModules);
  const unlockedModuleIds = useGameStore((state) => state.unlockedModuleIds);

  const canAffordModule = selectedModule.buildCost.every((cost) => {
    const stockAvailable = inventory[cost.resource] ?? 0;
    return stockAvailable >= cost.amount;
  });

  const handleTransmitBlueprint = () => {
    if (closeTab) closeTab();
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

  const unlockedModules = Object.values(MODULES).filter(
    (mod) =>
      (mod.isUnlockedByDefault || unlockedModuleIds.includes(mod.id)) &&
      mod.id !== "habitat",
  );

  const getModulesLeft = (mod: ModuleDef) => {
    const countPlaced = placedModules.filter((m) => m.id === mod.id).length;
    // Fallback support if maxModules isn't explicitly defined on every module object block
    const maxLimit = (mod as any).maxModules ?? Infinity;
    return maxLimit - countPlaced;
  };

  const canPlaceMore = (mod: ModuleDef) => {
    return getModulesLeft(mod) > 0;
  };

  const hasHitMaxLimit = !canPlaceMore(selectedModule);

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* 📋 SIDEBAR MENU */}
      <div className="w-3/5 rounded-xl overflow-y-auto scrollbar-none flex flex-wrap gap-2">
        {unlockedModules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setSelectedModule(mod)}
            style={{ backgroundImage: `url(${gridIcon})` }}
            className={`w-[calc(33.3%-0.4rem)] aspect-3/4 text-left p-3 rounded-xl border text-xs flex flex-col justify-between items-center transition ${
              selectedModule.id === mod.id
                ? "bg-neutral-800 border-white text-white"
                : "bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            <span className="text-lg text-white font-bold text-center leading-none">
              {mod.name.toUpperCase()}
            </span>
            <img
              src={TEXTURE_IMPORTS[mod.texture]}
              alt={mod.name}
              className={`pointer-events-none w-[calc(100%-1rem)]  object-contain ${selectedModule.id === mod.id ? "scale-105" : "scale-100"} transition-transform duration-150`}
            />
            <span className="text-md w-full text-right text-white font-bold">
              {mod.w}X{mod.h}
            </span>
          </button>
        ))}
      </div>

      {/* 🔍 DETAILED MODULAR INSPECTION PANEL */}
      <div className="w-2/5 flex flex-col justify-between bg-[#F9EEE0] p-4 rounded-xl border border-neutral-800 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-extrabold text-black">
              {selectedModule.name.toUpperCase()}
            </h3>
            <span className="text-xs text-neutral-500 font-extrabold leading-none">
              [{getModulesLeft(selectedModule)}/{selectedModule.maxModules}]
            </span>
          </div>
          <p className="text-[14px] font-medium text-sec mt-2 leading-tight">
            {selectedModule.description}
          </p>

          <div className="mt-4 flex flex-col gap-2 text-[14px] border-t border-sec pt-3 text-sec">
            <div className="flex items-center justify-between gap-1 font-bold">
              📐 Footprint:{" "}
              <span className="text-tertiary font-bold">
                {selectedModule.w} x {selectedModule.h} (Grid)
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 font-bold">
              ⚡ Grid Draw:{" "}
              <span
                className={
                  selectedModule.powerDraw < 0
                    ? "text-red-600 font-bold"
                    : "text-green-600 font-bold"
                }
              >
                {selectedModule.powerDraw} EU/h
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 font-bold">
              🛡️ Structural HP:{" "}
              <span className="text-tertiary font-bold">
                {selectedModule.maxIntegrity} Max
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 font-bold">
              ☢️ Radiation Exposure:{" "}
              <span className="text-tertiary font-bold">
                Day/night rates + wave events
              </span>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-[14px] text-black uppercase tracking-widest font-bold">
              Blueprint Material Requisites:
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedModule.buildCost.map((cost, idx) => (
                // <div
                //   key={idx}
                //   className="bg-neutral-900 border border-neutral-700 px-3 py-1 rounded text-xs"
                // >
                //   <span className="capitalize">
                //     {cost.resource.replace("_", " ")}
                //   </span>
                //   : <strong className="text-orange-400">{cost.amount}</strong>
                // </div>
                <div
                  key={idx}
                  className="w-[calc(30%-1rem)] hover:text-black hover:bg-white aspect-square bg-neutral-900 border border-neutral-800 p-1 rounded-xl flex flex-col justify-between items-center"
                >
                  <span className="capitalize font-medium text-[12px]">
                    {cost.resource.replace("_", " ")}
                  </span>
                  <img
                    src={MAT_IMPORTS[cost.resource]}
                    alt={cost.resource.replace("_", " ")}
                    className={`w-[calc(80%-1rem)]  aspect-square object-contain pointer-events-none`}
                  />
                  <strong className="text-[12px] w-full text-right">
                    x{cost.amount}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={!canAffordModule || hasHitMaxLimit}
          onClick={handleTransmitBlueprint}
          className={`w-full mt-6 font-bold py-4 px-4 rounded-full text-xs uppercase tracking-widest shadow-md transition-all duration-150 ${
            canAffordModule && !hasHitMaxLimit
              ? "bg-black hover:to-amber-500 text-white cursor-pointer transform hover:scale-[1.01]"
              : "bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed"
          }`}
        >
          {hasHitMaxLimit ? (
            <span className="flex items-center justify-center gap-2">
              <Lock size={18} /> Max Construction Reached
            </span>
          ) : !canAffordModule ? (
            <span className="flex items-center justify-center gap-2">
              <Lock size={18} /> Insufficient Materials
            </span>
          ) : (
            "Transmit Blueprint To Grid Map"
          )}
        </button>
      </div>
    </div>
  );
};
