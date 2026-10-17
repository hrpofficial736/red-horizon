import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { IsoScene } from "./scenes/IsoScene";
import { useGameStore } from "../store/useGameStore";

export default function PhaserGame() {
  const parentRef = useRef<HTMLDivElement>(null);
  const gameStateStore = useGameStore();

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
      console.log("Module placed:", data);
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
        console.log(
          "📋 Updated Zustand Placed Modules:",
          useGameStore.getState().placedModules,
        );
      } else {
        console.warn(
          "⚠️ Hackathon Validation: React rejected building deployment (insufficient resources).",
        );
      }
    };

    game.events.on("module-placed", handleModulePlaced);
    // Cleanup also makes React StrictMode (double-mount in dev) safe
    return () => {
      game.events.off("module-placed", handleModulePlaced);
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
