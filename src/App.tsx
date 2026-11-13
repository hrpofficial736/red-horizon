import { useEffect, useState } from "react";
import { useGameStore } from "./store/useGameStore";
import { BaseStatusHUD } from "./components/BaseStatusHUD";
import PhaserGame from "./game/PhaserGame";
import { BuildComponent } from "./components/BuildComponent";
import { InventoryComponent } from "./components/InventoryComponent";
import { DebugTimeSkip } from "./components/DebugTimeSkip";
import { CirclePile, Microscope, SatelliteDish, Wrench } from "lucide-react";
import ResourceOverlay from "./components/ResourceOverlay";
import { OverlayLayout } from "./components/OverlayLayout";
import { WorkshopComponent } from "./components/WorkshopComponent";
import { GreenhouseComponent } from "./components/GreenhouseComponent";
import { ResearchComponent } from "./components/ResearchComponent";
import { HabitatComponent } from "./components/HabitatComponent";
import { SleepTransitionOverlay } from "./components/SleepTransitionOverlay";
import { UplinkComponent } from "./components/UplinkComponent";
import { QuestPanel } from "./components/QuestPanel";
import { SaveMenu } from "./components/SaveMenu";
import { GameFailureOverlay } from "./components/GameFailureOverlay";
import { DustStormAlert } from "./components/DustStormAlert";

type ActiveTab = "none" | "build" | "inventory" | "research" | "logs";
type CraftingModuleId = "workshop" | "kitchen" | "greenhouse";

function App({ onBackToHome }: { onBackToHome: () => void }) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("none");
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const gameLogs = useGameStore((state) => state.gameLogs);
    const gameFailed = useGameStore((state) => state.gameFailed);
    const failureCause = useGameStore((state) => state.failureCause);
    const rescueMissionSuccessful = useGameStore(
        (state) => state.rescueMissionSuccessful,
    );
    const startNewGame = useGameStore((state) => state.startNewGame);

    const [showStatusModal, setShowStatusModal] = useState<any>(null);
    const [moveRequest, setMoveRequest] = useState<{
        uid: number;
        id: string;
        name?: string;
    } | null>(null);
    const [craftingModule, setCraftingModule] = useState<{
        id: string;
        instanceId: string;
    } | null>(null);
    const [habitatModule, setHabitatModule] = useState<{
        instanceId: string;
    } | null>(null);
    const [uplinkModule, setUplinkModule] = useState<{
        instanceId: string;
    } | null>(null);
    const placedModules = useGameStore((state) => state.placedModules);
    const hasResearchLab = placedModules.some(
        (module) => module.id === "researchLab",
    );
    const isOverlayOpen =
        activeTab !== "none" ||
        showStatusModal !== null ||
        moveRequest !== null ||
        craftingModule !== null ||
        habitatModule !== null ||
        uplinkModule !== null ||
        showSaveMenu ||
        gameFailed ||
        rescueMissionSuccessful;

    useEffect(() => {
        (
            window as Window & { __tharsisOverlayOpen?: boolean }
        ).__tharsisOverlayOpen = isOverlayOpen;

        return () => {
            (
                window as Window & { __tharsisOverlayOpen?: boolean }
            ).__tharsisOverlayOpen = false;
        };
    }, [isOverlayOpen]);

    const startPassiveTimer = useGameStore((state) => state.startPassiveTimer);
    const stopPassiveTimer = useGameStore((state) => state.stopPassiveTimer);
    const initializeGameSaves = useGameStore(
        (state) => state.initializeGameSaves,
    );
    const closeTab = () => {
        setShowStatusModal(null);
        setActiveTab("none");
    };
    const selectTab = (tab: ActiveTab) => {
        setCraftingModule(null);
        setHabitatModule(null);
        setUplinkModule(null);
        setActiveTab(activeTab === tab ? "none" : tab);
    };

    useEffect(() => {
        startPassiveTimer(); // Automatically starts ticking 1 game hour every 5 seconds

        // Safely clears the interval timer if the user refreshes or hot-reloads during development
        return () => stopPassiveTimer();
    }, [startPassiveTimer, stopPassiveTimer]);

    useEffect(() => {
        initializeGameSaves();
    }, [initializeGameSaves]);

    useEffect(() => {
        const triggerPopupOverlay = (e: any) => {
            if (e.detail.id === "habitat") {
                setCraftingModule(null);
                setHabitatModule({ instanceId: e.detail.instanceId });
                setActiveTab("none");
                return;
            }
            if (e.detail.id === "communication") {
                setCraftingModule(null);
                setHabitatModule(null);
                setUplinkModule({ instanceId: e.detail.instanceId });
                setActiveTab("none");
                return;
            }
            if (e.detail.id === "workshop") {
                setActiveTab("none");
                setCraftingModule(e.detail);
                return;
            }
            if (e.detail.id === "greenhouse") {
                setActiveTab("none");
                setCraftingModule(e.detail);
                return;
            }
            if (e.detail.id === "kitchen") {
                setActiveTab("none");
                setCraftingModule(e.detail);
                return;
            }
            if (e.detail.id === "sample_extractor") {
                setShowStatusModal(null);
                setActiveTab("none");
                setCraftingModule(e.detail);
                return;
            }
            if (e.detail.id === "researchLab") {
                setCraftingModule(null);
                setActiveTab("research");
                return;
            }
        };

        window.addEventListener("PHASER_POPUP_MODAL_SIGNAL", triggerPopupOverlay);
        return () =>
            window.removeEventListener(
                "PHASER_POPUP_MODAL_SIGNAL",
                triggerPopupOverlay,
            );
    }, []);

    useEffect(() => {
        const handleMoveRequest = (event: Event) => {
            setMoveRequest((event as CustomEvent<typeof moveRequest>).detail);
        };
        window.addEventListener("PHASER_MODULE_MOVE_REQUESTED", handleMoveRequest);
        return () =>
            window.removeEventListener(
                "PHASER_MODULE_MOVE_REQUESTED",
                handleMoveRequest,
            );
    }, []);

    const cancelMoveRequest = () => setMoveRequest(null);
    const confirmMoveRequest = () => {
        if (!moveRequest) return;
        window.dispatchEvent(
            new CustomEvent("PHASER_BEGIN_MODULE_MOVE", {
                detail: { uid: moveRequest.uid },
            }),
        );
        setMoveRequest(null);
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#1a0f0a] select-none text-white">
            <SleepTransitionOverlay />
            {(gameFailed || rescueMissionSuccessful) && !showSaveMenu && (
                <GameFailureOverlay
                    cause={
                        rescueMissionSuccessful
                            ? "ARES-7 has enough lead time to reach the outpost before Sol 29. The astronaut has been cleared for evacuation."
                            : failureCause ?? "The outpost could not complete the rescue mission."
                    }
                    onLoadGame={() => setShowSaveMenu(true)}
                    onNewGame={startNewGame}
                    success={rescueMissionSuccessful}
                />
            )}
            {/* 🎮 LAYER 1: PHASER CANVAS BACKGROUND CONTAINER (Lowest Depth) */}
            <div
                className={`absolute inset-0 z-0 ${isOverlayOpen ? "pointer-events-none" : "pointer-events-auto"
                    }`}
            >
                <PhaserGame />
            </div>

            {/* 🛸 LAYER 2: INTERACTIVE REACT HUD INTERFACE LAYER (Highest Depth) */}
            {/* We use global relative context here to punch through fixed canvasses */}
            <div className="relative w-full h-full z-50 pointer-events-none">
                <DustStormAlert />
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
                    <BaseStatusHUD onOpenMenu={() => setShowSaveMenu(true)} />
                    <QuestPanel />
                    <DebugTimeSkip />
                </div>

                {/* 🛸 HUD TOP-CENTER FLOATING OVERLAY: ACTIVE BASE RESOURCE STOCKPILES BAR */}
                <ResourceOverlay />

                {showSaveMenu && <SaveMenu onClose={() => setShowSaveMenu(false)} onBackToHome={onBackToHome} />}

                {/* 🟢 3. MOUNT THE FLOATING INSPECTION STAT OVERLAY CARD HERE */}
                {/* 🟢 3. PLOP THIS SIMPLE FLOATING MODAL DIRECTLY HERE */}
                {moveRequest && (
                    <div className="absolute left-1/2 top-1/3 z-50 w-80 -translate-x-1/2 rounded-xl border-2 border-neutral-700 bg-neutral-950/95 p-5 text-white shadow-2xl pointer-events-auto">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-orange-400">
                            Move module?
                        </h2>
                        <p className="mt-3 text-sm text-neutral-300">
                            Move this module to another position? Its health, state, and
                            progress will remain unchanged.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={cancelMoveRequest}
                                className="rounded border border-neutral-700 px-4 py-2 text-xs font-bold uppercase text-neutral-300"
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={confirmMoveRequest}
                                className="rounded border border-orange-500 bg-orange-950 px-4 py-2 text-xs font-bold uppercase text-orange-200"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                )}

                {/* 🪟 CENTRAL OPERATIONAL CONTROL OPTIONS TERMINAL BOX OVERLAY */}
                {activeTab !== "none" && (
                    <OverlayLayout
                        title={activeTab}
                        moduleType="TERMINAL"
                        onClose={closeTab}
                    >
                        {activeTab === "build" && <BuildComponent closeTab={closeTab} />}
                        {activeTab === "inventory" && <InventoryComponent />}
                        {activeTab === "research" && <ResearchComponent />}
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

                {habitatModule && (
                    <OverlayLayout
                        title="HABITAT"
                        moduleType="TERMINAL"
                        onClose={() => setHabitatModule(null)}
                    >
                        <HabitatComponent instanceId={habitatModule.instanceId} />
                    </OverlayLayout>
                )}

                {uplinkModule && (
                    <UplinkComponent
                        hasRadar={placedModules.some(
                            (module) =>
                                module.id === "radar" && module.active && module.hp > 0,
                        )}
                        onClose={() => setUplinkModule(null)}
                    />
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
                                    (module.id === "workshop" ||
                                        module.id === "kitchen" ||
                                        module.id === "greenhouse" ||
                                        module.id === "sample_extractor") &&
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
                        {craftingModule.id === "workshop" && <WorkshopComponent />}
                        {craftingModule.id === "kitchen" && <WorkshopComponent isKitchen />}
                        {craftingModule.id === "greenhouse" && <GreenhouseComponent />}
                        {craftingModule.id === "sample_extractor" && (
                            <WorkshopComponent isSampleExtractor />
                        )}
                    </OverlayLayout>
                )}

                {/* 🧭 HUD BOTTOM-CENTER: TABS DIRECTORY BAR MENU NAVIGATION */}
                <div className="absolute bottom-6 left-1/2 z-60 -translate-x-1/2 bg-neutral-950/90 border border-neutral-800 p-2 rounded-full flex gap-2 backdrop-blur shadow-xl pointer-events-auto">
                    {(
                        [
                            "build",
                            "inventory",
                            ...(hasResearchLab ? ["research"] : []),
                            "logs",
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => selectTab(tab as ActiveTab)}
                            className={`px-5 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${activeTab === tab
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
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;
