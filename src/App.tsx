import { useState } from "react";
import { useGameStore } from "./store/useGameStore";
import { BaseStatusHUD } from "./components/BaseStatusHUD";
import PhaserGame from "./game/PhaserGame";
import { BuildComponent } from "./components/BuildComponent";
import { InventoryComponent } from "./components/InventoryComponent";

type ActiveTab = "none" | "build" | "inventory" | "research" | "logs";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("none");
  const inventory = useGameStore((state) => state.inventory);
  const gameLogs = useGameStore((state) => state.gameLogs);

  const closeTab = () => setActiveTab("none");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a0f0a] select-none text-white font-mono">
      {/* 🎮 LAYER 1: PHASER CANVAS BACKGROUND CONTAINER (Lowest Depth) */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <PhaserGame />
      </div>

      {/* 🛸 LAYER 2: INTERACTIVE REACT HUD INTERFACE LAYER (Highest Depth) */}
      {/* We use global relative context here to punch through fixed canvasses */}
      <div className="relative w-full h-full z-50 pointer-events-none">
        {/* 📊 CORE HUD STATUS DATA METRICS PANEL (Top Right) */}
        <div className="pointer-events-auto">
          <BaseStatusHUD />
        </div>

        {/* 🛸 HUD TOP-CENTER FLOATING OVERLAY: ACTIVE BASE RESOURCE STOCKPILES BAR */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-6 bg-neutral-900/95 border border-neutral-700 px-6 py-3 rounded-full backdrop-blur shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-orange-400">🪨</span>
            <div>
              <span className="text-[10px] text-neutral-400 block leading-none tracking-wider">
                IRON ORE
              </span>
              <strong className="text-sm">{inventory.iron_ore ?? 0}</strong>
            </div>
          </div>
          <div className="w-[1px] bg-neutral-700 h-6 my-auto" />
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">💎</span>
            <div>
              <span className="text-[10px] text-neutral-400 block leading-none tracking-wider">
                SILICATE
              </span>
              <strong className="text-sm">{inventory.silicates ?? 0}</strong>
            </div>
          </div>
          <div className="w-[1px] bg-neutral-700 h-6 my-auto" />
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">💧</span>
            <div>
              <span className="text-[10px] text-neutral-400 block leading-none tracking-wider">
                WATER
              </span>
              <strong className="text-sm">{inventory.water ?? 0}</strong>
            </div>
          </div>
          <div className="w-[1px] bg-neutral-700 h-6 my-auto" />
          <div className="flex items-center gap-2">
            <span className="text-green-500">🌾</span>
            <div>
              <span className="text-[10px] text-neutral-400 block leading-none tracking-wider">
                FOOD
              </span>
              <strong className="text-sm">{inventory.food ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* 🪟 CENTRAL OPERATIONAL CONTROL OPTIONS TERMINAL BOX OVERLAY */}
        {activeTab !== "none" && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[90vw] max-w-4xl h-[55vh] bg-neutral-950/95 border-2 border-neutral-800 rounded-xl shadow-2xl backdrop-blur-md flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header context controller row */}
            <div className="flex justify-between items-center border-b border-neutral-800 px-5 py-3 bg-neutral-900/50">
              <h2 className="text-xs font-bold tracking-widest text-orange-400 uppercase font-mono">
                ⚡ ARES STATION TERMINAL // TERMINAL_{activeTab}
              </h2>
              <button
                onClick={closeTab}
                className="text-neutral-500 hover:text-white transition text-xs bg-neutral-800 px-2 py-1 rounded cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Active component frame body content */}
            <div className="flex-1 overflow-hidden p-4">
              {activeTab === "build" && <BuildComponent />}
              {activeTab === "inventory" && <InventoryComponent />}
              {activeTab === "research" && (
                <div className="h-full flex items-center justify-center text-neutral-500 italic text-xs">
                  📡 CORE LINK WARNING: Blueprint research subtrees down until
                  Laboratory module is deployed.
                </div>
              )}
              {activeTab === "logs" && (
                <div className="h-full overflow-y-auto space-y-2 bg-black/50 p-3 rounded border border-neutral-900 text-xs text-green-400 font-mono">
                  {gameLogs
                    .slice()
                    .reverse()
                    .map((log, index) => (
                      <div
                        key={index}
                        className="border-b border-neutral-900 pb-1 last:border-0"
                      >
                        {log}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🧭 HUD BOTTOM-CENTER: TABS DIRECTORY BAR MENU NAVIGATION */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-950/90 border border-neutral-800 p-2 rounded-xl flex gap-2 backdrop-blur shadow-xl pointer-events-auto">
          {(["build", "inventory", "research", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? "none" : tab)}
              className={`px-5 py-3 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                activeTab === tab
                  ? "bg-orange-500 text-black shadow-lg scale-105 font-bold"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              {tab === "build" && "🏗️ Build"}
              {tab === "inventory" && "🎒 Bag"}
              {tab === "research" && "🔬 Research"}
              {tab === "logs" && "📡 Comms Log"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
