import { useEffect, useState } from "react";
import { useGameStore } from "./store/useGameStore";
import { BaseStatusHUD } from "./components/BaseStatusHUD";
import PhaserGame from "./game/PhaserGame";
import { BuildComponent } from "./components/BuildComponent";
import { InventoryComponent } from "./components/InventoryComponent";
import { MODULES } from "./game/modules/moduleDefinitions";
import { DebugTimeSkip } from "./components/DebugTimeSkip";
import { CirclePile, Microscope, SatelliteDish, Wrench } from "lucide-react";
import ResourceOverlay from "./components/ResourceOverlay";
import { OverlayLayout } from "./components/OverlayLayout";
import { WorkshopComponent } from "./components/WorkshopComponent";
import { GreenhouseComponent } from "./components/GreenhouseComponent";

type ActiveTab = "none" | "build" | "inventory" | "research" | "logs";
type CraftingModuleId = "workshop" | "greenhouse";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("none");
  const gameLogs = useGameStore((state) => state.gameLogs);

  const [showStatusModal, setShowStatusModal] = useState<any>(null);
  const [craftingModule, setCraftingModule] = useState<{
    id: string;
    instanceId: string;
  } | null>(null);
  const placedModules = useGameStore((state) => state.placedModules);
  const isOverlayOpen =
    activeTab !== "none" ||
    showStatusModal !== null ||
    craftingModule !== null;

  useEffect(() => {
    (window as Window & { __tharsisOverlayOpen?: boolean }).__tharsisOverlayOpen =
      isOverlayOpen;

    return () => {
      (
        window as Window & { __tharsisOverlayOpen?: boolean }
      ).__tharsisOverlayOpen = false;
    };
  }, [isOverlayOpen]);

  const startPassiveTimer = useGameStore((state) => state.startPassiveTimer);
  const stopPassiveTimer = useGameStore((state) => state.stopPassiveTimer);

  const closeTab = () => setActiveTab("none");
  const selectTab = (tab: ActiveTab) => {
    setShowStatusModal(null);
    setCraftingModule(null);
    setActiveTab(activeTab === tab ? "none" : tab);
  };

  useEffect(() => {
    startPassiveTimer(); // Automatically starts ticking 1 game hour every 5 seconds

    // Safely clears the interval timer if the user refreshes or hot-reloads during development
    return () => stopPassiveTimer();
  }, [startPassiveTimer, stopPassiveTimer]);

  useEffect(() => {
    const triggerPopupOverlay = (e: any) => {
      if (e.detail.id === "workshop") {
        setShowStatusModal(null);
        setActiveTab("none");
        setCraftingModule(e.detail);
        return;
      }
      if (e.detail.id === "greenhouse") {
        setShowStatusModal(null);
        setActiveTab("none");
        setCraftingModule(e.detail);
        return;
      }
      setShowStatusModal(e.detail); // Saves the clicked module information
    };

    window.addEventListener("PHASER_POPUP_MODAL_SIGNAL", triggerPopupOverlay);
    return () =>
      window.removeEventListener(
        "PHASER_POPUP_MODAL_SIGNAL",
        triggerPopupOverlay,
      );
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a0f0a] select-none text-white">
      {/* 🎮 LAYER 1: PHASER CANVAS BACKGROUND CONTAINER (Lowest Depth) */}
      <div
        className={`absolute inset-0 z-0 ${
          isOverlayOpen ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <PhaserGame />
      </div>

      {/* 🛸 LAYER 2: INTERACTIVE REACT HUD INTERFACE LAYER (Highest Depth) */}
      {/* We use global relative context here to punch through fixed canvasses */}
      <div className="relative w-full h-full z-50 pointer-events-none">
        {isOverlayOpen && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-40 pointer-events-auto"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          />
        )}
        {/* 📊 CORE HUD STATUS DATA METRICS PANEL (Top Right) */}
        <div className="pointer-events-auto">
          <BaseStatusHUD />
          <DebugTimeSkip />
        </div>

        {/* 🛸 HUD TOP-CENTER FLOATING OVERLAY: ACTIVE BASE RESOURCE STOCKPILES BAR */}
        <ResourceOverlay />

        {/* 🟢 3. MOUNT THE FLOATING INSPECTION STAT OVERLAY CARD HERE */}
        {/* 🟢 3. PLOP THIS SIMPLE FLOATING MODAL DIRECTLY HERE */}
        {showStatusModal &&
          (() => {
            const liveModuleData = placedModules.find(
              (m: any) => m.instanceId === showStatusModal.instanceId,
            );

            // 🟢 FIXED: Reads directly from static definitions to completely sandbox 0 HP testing bugs
            const moduleConfig = MODULES[showStatusModal.id];
            const maxIntegrity =
              moduleConfig && moduleConfig.maxIntegrity > 0
                ? moduleConfig.maxIntegrity
                : 100;

            const currentHP = liveModuleData ? liveModuleData.hp : maxIntegrity;
            const hpPercentage =
              maxIntegrity > 0
                ? Math.round((currentHP / maxIntegrity) * 100)
                : 0;

            let healthTextColor = "text-green-400";
            let healthBarColor = "bg-green-500";
            if (hpPercentage < 65) {
              healthTextColor = "text-amber-400";
              healthBarColor = "bg-amber-500";
            }
            if (hpPercentage < 30) {
              healthTextColor = "text-red-500 animate-pulse font-bold";
              healthBarColor = "bg-red-600";
            }

            return (
              <div className="absolute top-1/4 left-8 z-50 w-76 bg-neutral-950/95 border-2 border-neutral-800 text-white p-4 rounded-xl font-mono shadow-2xl pointer-events-auto flex flex-col backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-3">
                  <span className="text-orange-400 font-bold text-xs uppercase tracking-wider">
                    ⚡ MODULE TELEMETRY
                  </span>
                  <button
                    onClick={() => {
                      setShowStatusModal(null);
                      clearInterval((window as any).repairFastForwardId);
                      useGameStore.getState().startPassiveTimer();
                    }}
                    className="text-neutral-500 hover:text-white cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs space-y-3 mb-4">
                  <div>
                    Module Class:{" "}
                    <strong className="capitalize text-white">
                      {showStatusModal.id}
                    </strong>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase mb-1 tracking-wider">
                      Structural Integrity:
                    </span>
                    <div className="w-full bg-neutral-900 h-2.5 rounded border border-neutral-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${healthBarColor}`}
                        style={{
                          width: `${Math.max(0, Math.min(100, hpPercentage))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 text-neutral-400">
                      <span>
                        Status:{" "}
                        <span className={healthTextColor}>
                          {currentHP} / {maxIntegrity} HP
                        </span>
                      </span>
                      <span>{hpPercentage}%</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={currentHP >= maxIntegrity}
                  onMouseDown={() => {
                    if (!liveModuleData) return;

                    const store = useGameStore.getState();
                    const sessionKey = `kit_locked_${liveModuleData.instanceId}`;
                    const isKitAlreadyAllocated =
                      (window as any)[sessionKey] === true;

                    if (!isKitAlreadyAllocated) {
                      const hasKit = store.consumeResource("repair_kit", 1);
                      if (!hasKit) {
                        alert(
                          "❌ MAINTENANCE REFUSED: Out of functional Multi-Tool Repair Kits!",
                        );
                        return;
                      }
                      (window as any)[sessionKey] = true;
                      console.log(
                        `🔧 Repair Kit locked and dedicated to module: ${liveModuleData.instanceId}`,
                      );
                    }

                    store.stopPassiveTimer();

                    (window as any).repairFastForwardId = setInterval(() => {
                      const innerStore = useGameStore.getState();

                      const currentModuleState = innerStore.placedModules.find(
                        (m: any) => m.instanceId === liveModuleData.instanceId,
                      );

                      if (
                        !currentModuleState ||
                        currentModuleState.hp >= maxIntegrity
                      ) {
                        clearInterval((window as any).repairFastForwardId);
                        innerStore.startPassiveTimer();

                        (window as any)[sessionKey] = false;
                        console.log(
                          "🔒 Repair complete. Dedicated kit released.",
                        );
                        return;
                      }

                      let nextMin = innerStore.currentMinute + 5;

                      const updatedModules = innerStore.placedModules.map(
                        (m: any) => {
                          if (m.instanceId === liveModuleData.instanceId) {
                            return {
                              ...m,
                              hp: Math.min(maxIntegrity, m.hp + 1),
                            };
                          }
                          return m;
                        },
                      );

                      if (nextMin >= 60) {
                        innerStore.advanceHour(1);
                        useGameStore.setState({
                          currentMinute: 0,
                          placedModules: updatedModules,
                        });
                      } else {
                        useGameStore.setState({
                          currentMinute: nextMin,
                          placedModules: updatedModules,
                        });
                      }
                    }, 50);
                  }}
                  onMouseUp={() => {
                    clearInterval((window as any).repairFastForwardId);
                    useGameStore.getState().startPassiveTimer();
                  }}
                  onMouseLeave={() => {
                    clearInterval((window as any).repairFastForwardId);
                    useGameStore.getState().startPassiveTimer();
                  }}
                  className={`w-full font-bold py-3 px-3 rounded text-center text-xs uppercase tracking-wider select-none transition-all duration-150 ${
                    currentHP >= maxIntegrity
                      ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-400 text-black active:scale-[0.99] cursor-pointer"
                  }`}
                >
                  {currentHP >= maxIntegrity
                    ? "🔧 NOMINAL STATUS"
                    : "✊ HOLD TO REPAIR"}
                </button>
              </div>
            );
          })()}

        {/* 🪟 CENTRAL OPERATIONAL CONTROL OPTIONS TERMINAL BOX OVERLAY */}
        {activeTab !== "none" && (
          <OverlayLayout
            title={activeTab}
            moduleType="TERMINAL"
            onClose={closeTab}
          >
            {activeTab === "build" && <BuildComponent closeTab={closeTab} />}
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
          </OverlayLayout>
        )}

        {craftingModule && (
          <OverlayLayout
            title={`MODULE ${craftingModule.id.toUpperCase()} // ${craftingModule.id.toUpperCase()}`}
            moduleType="PRODUCTION"
            onClose={() => setCraftingModule(null)}
            activeModuleId={craftingModule.id as CraftingModuleId}
            moduleTabs={placedModules
              .filter(
                (module, index, modules) =>
                  (module.id === "workshop" || module.id === "greenhouse") &&
                  modules.findIndex(
                    (candidate) => candidate.id === module.id,
                  ) === index,
              )
              .map((module) => ({
                id: module.id,
                label: module.id,
                onClick: () =>
                  setCraftingModule({
                    id: module.id,
                    instanceId: module.instanceId,
                  }),
              }))}
          >
            {craftingModule.id === "workshop" ? (
              <WorkshopComponent />
            ) : (
              <GreenhouseComponent />
            )}
          </OverlayLayout>
        )}

        {/* 🧭 HUD BOTTOM-CENTER: TABS DIRECTORY BAR MENU NAVIGATION */}
        <div className="absolute bottom-6 left-1/2 z-[60] -translate-x-1/2 bg-neutral-950/90 border border-neutral-800 p-2 rounded-full flex gap-2 backdrop-blur shadow-xl pointer-events-auto">
          {(["build", "inventory", "research", "logs"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => selectTab(tab)}
                className={`px-5 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-black shadow-lg scale-105 font-bold"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                {tab === "build" && (
                  <span className="flex items-center gap-2">
                    <Wrench size={16} />
                    Build
                  </span>
                )}
                {tab === "inventory" && (
                  <span className="flex items-center gap-2">
                    <CirclePile size={16} />
                    Inventory
                  </span>
                )}
                {tab === "research" && (
                  <span className="flex items-center gap-2">
                    <Microscope size={16} />
                    Research
                  </span>
                )}
                {tab === "logs" && (
                  <span className="flex items-center gap-2">
                    <SatelliteDish size={16} />
                    Logs
                  </span>
                )}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
