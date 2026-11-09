import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { IsoScene } from "./scenes/IsoScene";
import { useGameStore } from "../store/useGameStore";

export default function PhaserGame() {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parentRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentRef.current,
      backgroundColor: "#1a0f0a",
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      scale: {
        mode: Phaser.Scale.RESIZE, // canvas always fills the container
        width: "100%",
        height: "100%",
      },
      scene: [IsoScene],
    });

    (window as any).phaserGameInstance = game;

    // Example: listen to tile clicks from React (for your HUD / build menu)
    const onTile = (t: { col: number; row: number }) => console.log("tile", t);
    game.events.on("tile-click", onTile);
    const handleModulePlaced = (data: {
      uid: number;
      id: string;
      col: number;
      row: number;
    }) => {
      // console.log("Module placed:", data);
      // console.log("UID:", data.uid);
      // console.log("Module ID:", data.id);
      // console.log("Grid position:", data.col, data.row);

      // gameStateStore.buildModule(data.id, data.row, data.col);
      // console.log(gameStateStore.placedModules);

      const storeActions = useGameStore.getState();

      // Fire building deployment mechanics logic
      const wasBuilt = storeActions.buildModule(data.id, data.row, data.col);

      if (wasBuilt) {
        // Read the absolute freshest array to confirm the change took effect
        // console.log(
        //   "📋 Updated Zustand Placed Modules:",
        //   useGameStore.getState().placedModules,
        // );
      } else {
        console.warn(
          "⚠️ Hackathon Validation: React rejected building deployment (insufficient resources).",
        );
      }
    };

    game.events.on("module-placed", handleModulePlaced);

    const handleModuleMoved = (data: {
      id: string;
      oldCol: number;
      oldRow: number;
      col: number;
      row: number;
    }) => {
      const module = useGameStore
        .getState()
        .placedModules.find(
          (candidate) =>
            candidate.id === data.id &&
            candidate.x === data.oldRow &&
            candidate.y === data.oldCol,
        );
      if (module) {
        useGameStore
          .getState()
          .moveModule(module.instanceId, data.row, data.col);
      }
    };

    game.events.on("module-moved", handleModuleMoved);

    const handleModuleMoveRequested = (data: {
      uid: number;
      id: string;
      col: number;
      row: number;
    }) => {
      window.dispatchEvent(
        new CustomEvent("PHASER_MODULE_MOVE_REQUESTED", { detail: data }),
      );
    };

    game.events.on("module-move-requested", handleModuleMoveRequested);

    const handleBeginModuleMove = (event: Event) => {
      const data = (event as CustomEvent<{ uid: number }>).detail;
      game.events.emit("begin-module-move", data.uid);
    };
    window.addEventListener("PHASER_BEGIN_MODULE_MOVE", handleBeginModuleMove);

    const handleModuleClicked = (data: {
      uid: number;
      id: string;
      col: number;
      row: number;
    }) => {
      if (
        (window as Window & { __tharsisOverlayOpen?: boolean })
          .__tharsisOverlayOpen
      ) {
        return;
      }
      // console.log(
      //   "🛸 Phaser engine reports module node context select target click:",
      //   data,
      // );

      // Fetch the full list from store to capture the instanceId matching these grid tiles
      const liveMod = useGameStore
        .getState()
        .placedModules.find((m: any) => m.x === data.row && m.y === data.col);

      // console.log(
      //   "🛸 React store lookup for module instanceId matching these grid tiles:",
      //   liveMod,
      // );

      // Forward everything safely up to the React modal box
      window.dispatchEvent(
        new CustomEvent("PHASER_POPUP_MODAL_SIGNAL", {
          detail: {
            ...data,
            instanceId: liveMod ? liveMod.instanceId : `${data.id}-fallback`,
          },
        }),
      );
    };

    game.events.on("module-clicked", handleModuleClicked);

    // Cleanup also makes React StrictMode (double-mount in dev) safe
    return () => {
      game.events.off("module-placed", handleModulePlaced);
      game.events.off("module-moved", handleModuleMoved);
      game.events.off("module-move-requested", handleModuleMoveRequested);
      window.removeEventListener(
        "PHASER_BEGIN_MODULE_MOVE",
        handleBeginModuleMove,
      );
      game.events.off("module-clicked", handleModuleClicked);
      game.events.off("tile-click", onTile);
      (window as any).phaserGameInstance = null;
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={parentRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        padding: 0,
        margin: 0,
        cursor: "grab",
        touchAction: "none",
        overflowY: "hidden",
        zIndex: 0,
      }}
    />
  );
}
