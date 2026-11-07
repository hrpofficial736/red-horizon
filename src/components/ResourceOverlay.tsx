import { MAT_IMPORTS } from "../game/utils/materialsTexture";
import {
  getInventoryTotal,
  getStorageCapacity,
  useGameStore,
} from "../store/useGameStore";

export default function ResourceOverlay() {
  const inventory = useGameStore((state) => state.inventory);
  const placedModules = useGameStore((state) => state.placedModules);
  const currentCapacity = getInventoryTotal(inventory);
  const totalCapacity = getStorageCapacity(placedModules);
  const isStorageFull =
    totalCapacity > 0 && currentCapacity >= totalCapacity;
  const isStorageNearFull =
    totalCapacity > 0 && currentCapacity / totalCapacity >= 0.8;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-row min-w-6xl items-center gap-4 bg-neutral-900/95 border border-neutral-700 px-6 py-3 rounded-full backdrop-blur shadow-2xl pointer-events-auto">
      <div
        className={`flex flex-col items-center border-r pr-6 ${
          isStorageFull
            ? "border-red-500"
            : isStorageNearFull
              ? "border-amber-500"
              : "border-neutral-700"
        }`}
      >
        <span className="text-[10px] text-neutral-400 tracking-wider">
          STORAGE
        </span>
        <strong
          className={`text-xs ${
            isStorageFull
              ? "text-red-400"
              : isStorageNearFull
                ? "text-amber-300"
                : "text-white"
          }`}
        >
          {currentCapacity}/{totalCapacity}
        </strong>
        {/* {isStorageFull && (
          <span className="text-[9px] font-bold text-red-400">
            STORAGE FULL
          </span>
        )}
        {!isStorageFull && isStorageNearFull && (
          <span className="text-[9px] font-bold text-amber-300">
            STORAGE NEAR FULL
          </span>
        )} */}
      </div>
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["iron_ore"]}
          alt="iron_ore"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none  tracking-wider">
            IRON ORE
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.iron_ore ?? 0}
          </strong>
        </div>
      </div>
      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["silicates"]}
          alt="iron_ore"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none tracking-wider">
            SILICATE
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.silicates ?? 0}
          </strong>
        </div>
      </div>
      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["iron_plate"]}
          alt="iron_plate"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none tracking-wider">
            IRON PLATE
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.iron_plate ?? 0}
          </strong>
        </div>
      </div>
      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["glass_panel"]}
          alt="glass_panel"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none tracking-wider">
            GLASS PANEL
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.glass_panel ?? 0}
          </strong>
        </div>
      </div>
      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["electronics"]}
          alt="electronics"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none tracking-wider">
            ELECTRONICS
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.electronics ?? 0}
          </strong>
        </div>
      </div>

      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["repair_kit"]}
          alt="repair_kit"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none tracking-wider">
            REPAIR KIT
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.repair_kit ?? 0}
          </strong>
        </div>
      </div>

      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["raw_food"]}
          alt="iron_ore"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none tracking-wider">
            RAW FOOD
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.raw_food ?? 0}
          </strong>
        </div>
      </div>

      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["soup"]}
          alt="soup"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none tracking-wider">
            SOUP
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.soup ?? 0}
          </strong>
        </div>
      </div>
      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["water"]}
          alt="iron_ore"
          className={`w-6 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] text-neutral-400 text-center block leading-none tracking-wider">
            WATER
          </span>
          <strong className="text-xs w-full text-center">
            x{inventory.water ?? 0}
          </strong>
        </div>
      </div>
    </div>
  );
}
