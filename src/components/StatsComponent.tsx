import { MODULES } from "../game/modules/moduleDefinitions";
import { MAT_ICONS } from "../game/utils/matetialsIcons";
import { useGameStore } from "../store/useGameStore";
import { RepairButton } from "./RepairButton";

export function StatsComponent() {
  const placedModules = useGameStore((state) => state.placedModules);
  const hasPowerSurplus = useGameStore((state) => {
    const totals = state.placedModules.reduce(
      (power, module) => {
        if (module.hp <= 0) return power;
        const config = MODULES[module.id];
        if (!config) return power;
        if (config.powerDraw > 0) {
          power.generated += config.powerDraw;
        } else {
          power.consumed += Math.abs(config.powerDraw);
        }
        return power;
      },
      { generated: 0, consumed: 0 },
    );
    return totals.generated >= totals.consumed;
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden text-white">
      <div className="flex flex-row justify-between gap-3 border-b border-neutral-800 px-4 pb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        <span>Module</span>
        <span>Status</span>
        <span>Health</span>
        <span>Power</span>
        <span>Production / Hr</span>
        <span>Maintenance</span>
      </div>

      <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
        {placedModules.length === 0 ? (
          <p className="py-10 text-center text-xs italic text-neutral-500">
            No modules have been placed.
          </p>
        ) : (
          placedModules.map((module) => {
            const config = MODULES[module.id];
            if (!config) return null;

            const hpPercentage = Math.round(
              (module.hp / config.maxIntegrity) * 100,
            );
            const isActive = module.hp > 0 && hasPowerSurplus;
            return (
              <div
                key={module.instanceId}
                className="flex flex-row items-center gap-3 justify-between rounded-xl border border-neutral-800 bg-black/55 px-4 py-3"
              >
                <div className="min-w-0">
                  <strong className="block w-30 text-xs uppercase">
                    {config.name}
                  </strong>
                  <span className="text-[10px] text-neutral-500">
                    Grid ({module.x}, {module.y})
                  </span>
                </div>
                <span
                  className={`w-fit rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${
                    isActive
                      ? "border-green-500/50 text-green-300"
                      : "border-red-500/50 text-red-300"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
                <div className="min-w-25">
                  <div className="mb-1 flex justify-between text-[10px]">
                    <span>{module.hp}/{config.maxIntegrity}</span>
                    <span>{hpPercentage}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-neutral-800">
                    <div
                      className={`h-full ${
                        hpPercentage < 30
                          ? "bg-red-500"
                          : hpPercentage < 65
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.max(0, Math.min(100, hpPercentage))}%`,
                      }}
                    />
                  </div>
                </div>
                <div
                  className={`text-xs ${
                    config.powerDraw < 0 ? "text-red-300" : "text-green-300"
                  }`}
                >
                  {config.powerDraw > 0 ? "+" : ""}
                  {config.powerDraw} EU/h
                  <span className="mt-1 block text-[10px] text-neutral-500">
                    Radiation day/night rates + waves
                  </span>
                </div>
                <div className="flex w-30 flex-wrap items-center gap-2">
                  {config.productionOutputs?.map((rate) => (
                    <span
                      key={`output-${rate.resource}`}
                      className="flex items-center text-xs gap-1 text-green-300"
                      title={`Produces ${rate.amountPerTick} ${rate.resource} per hour`}
                    >
                      <img
                        src={MAT_ICONS[rate.resource]}
                        alt={rate.resource}
                        className="h-4 w-4 object-contain"
                      />
                      <strong>+{rate.amountPerTick}/h</strong>
                    </span>
                  ))}
                  {config.productionInputs?.map((rate) => (
                    <span
                      key={`input-${rate.resource}`}
                      className="flex items-center text-xs gap-1 text-red-300"
                      title={`Consumes ${rate.amountPerTick} ${rate.resource} per hour`}
                    >
                      <img
                        src={MAT_ICONS[rate.resource]}
                        alt={rate.resource}
                        className="h-4 w-4 object-contain"
                      />
                      <strong>-{rate.amountPerTick}/h</strong>
                    </span>
                  ))}
                  {!config.productionOutputs?.length &&
                    !config.productionInputs?.length && (
                      <span className="text-neutral-500">—</span>
                    )}
                </div>
                <RepairButton moduleInstance={module} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
