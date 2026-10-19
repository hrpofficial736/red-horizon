import { MAT_IMPORTS } from "../game/utils/materialsTexture";
import { useGameStore } from "../store/useGameStore";

export default function ResourceOverlay() {
  const inventory = useGameStore((state) => state.inventory);
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-6 bg-neutral-900/95 border border-neutral-700 px-6 py-3 rounded-full backdrop-blur shadow-2xl pointer-events-auto">
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["iron_ore"]}
          alt="iron_ore"
          className={`w-8 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-neutral-400 block leading-none tracking-wider">
            IRON ORE
          </span>
          <strong className="text-sm w-full text-center">
            x{inventory.iron_ore ?? 0}
          </strong>
        </div>
      </div>
      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["silicates"]}
          alt="iron_ore"
          className={`w-8 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-neutral-400 block leading-none tracking-wider">
            SILICATE
          </span>
          <strong className="text-sm w-full text-center">
            x{inventory.silicates ?? 0}
          </strong>
        </div>
      </div>
      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["water"]}
          alt="iron_ore"
          className={`w-8 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-neutral-400 block leading-none tracking-wider">
            WATER
          </span>
          <strong className="text-sm w-full text-center">
            x{inventory.water ?? 0}
          </strong>
        </div>
      </div>
      <div className="w-px bg-neutral-700 h-6 my-auto" />
      <div className="flex items-center gap-2">
        <img
          src={MAT_IMPORTS["raw_food"]}
          alt="iron_ore"
          className={`w-8 aspect-square object-contain pointer-events-none`}
        />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-neutral-400 block leading-none tracking-wider">
            RAW FOOD
          </span>
          <strong className="text-sm w-full text-center">
            x{inventory.raw_food ?? 0}
          </strong>
        </div>
      </div>
    </div>
  );
}
