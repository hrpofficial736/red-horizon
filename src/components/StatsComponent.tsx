import { MODULES } from "../game/modules/moduleDefinitions";
import { MAT_ICONS } from "../game/utils/matetialsIcons";
import {
  hasOperationalPower,
  isCriticalPowerModule,
  useGameStore,
} from "../store/useGameStore";
import { RepairButton } from "./RepairButton";

export function StatsComponent() {
  const placedModules = useGameStore((state) => state.placedModules);
  const powerBankCharge = useGameStore((state) => state.powerBankCharge);
  const currentHour = useGameStore((state) => state.currentHour);
  const toggleModule = useGameStore((state) => state.toggleModule);
  const togglePowerSupply = useGameStore((state) => state.togglePowerSupply);
  const hasPowerSurplus = useGameStore((state) => {
    return hasOperationalPower(
      state.placedModules,
      state.powerBankCharge,
      state.currentHour,
    );
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden text-white">
      <div className="flex flex-row justify-between gap-3 border-b border-neutral-800 px-4 pb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        <span className="min-w-24">Module</span>
        <span>Status</span>
        <span>Health</span>
        <span>Power</span>
        <span>Production / Hr</span>
        <span>Maintenance</span>
      </div>

      <div className="min-h-0 space-y-2 overflow-y-auto scrollbar-none pr-1">
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
            const displayedHp = Math.round(module.hp);
            const isPowerGenerator = config.powerDraw > 0;
            const isActive =
              module.active &&
              module.hp > 0 &&
              (isPowerGenerator ||
                isCriticalPowerModule(module.id) ||
                hasPowerSurplus);
            const canActivate =
              module.hp > 0 &&
              (isPowerGenerator ||
                hasOperationalPower(
                  placedModules.map((candidate) =>
                    candidate.instanceId === module.instanceId
                      ? { ...candidate, active: true }
                      : candidate,
                  ),
                  powerBankCharge,
                  currentHour,
                ));
            const canToggle =
              !isPowerGenerator &&
              !isCriticalPowerModule(module.id) &&
              module.hp > 0 &&
              (module.active || canActivate);
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
                <div className="flex flex-col gap-1 items-center">
                  <span
                    className={`w-fit rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${
                      isActive
                        ? "border-green-500/50 text-green-300"
                        : "border-red-500/50 text-red-300"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    aria-label={
                      isPowerGenerator
                        ? `${config.name} is automatic`
                        : `${module.active ? "Deactivate" : canActivate ? "Activate" : "Waiting for power"} ${config.name}`
                    }
                    disabled={!canToggle}
                    onClick={() => toggleModule(module.instanceId)}
                    className={`relative h-5 w-10 shrink-0 rounded-full border transition ${
                      isActive
                        ? "border-green-500/60 bg-green-900/70"
                        : "border-neutral-700 bg-neutral-900 opacity-60"
                    } ${
                      !canToggle
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition ${
                        isActive
                          ? "left-5 bg-green-300"
                          : "left-0.5 bg-neutral-400"
                      }`}
                    />
                  </button>
                  {module.id === "battery" && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={module.powerSupplyEnabled}
                      aria-label={`${module.powerSupplyEnabled ? "Stop" : "Start"} battery power supply`}
                      disabled={module.hp <= 0}
                      onClick={() => togglePowerSupply(module.instanceId)}
                      className={`rounded border px-2 py-1 text-[9px] font-bold uppercase ${
                        module.powerSupplyEnabled
                          ? "border-cyan-500/60 bg-cyan-950/60 text-cyan-300"
                          : "border-neutral-700 bg-neutral-900 text-neutral-500"
                      }`}
                    >
                      {module.powerSupplyEnabled ? "Supply on" : "Supply off"}
                    </button>
                  )}
                </div>
                <div className="min-w-25">
                  <div className="mb-1 flex justify-between text-[10px]">
                    <span>
                      {displayedHp}/{config.maxIntegrity}
                    </span>
                    <span>{hpPercentage}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-neutral-800">
                    <div
                      className={`h-full ${
                        hpPercentage < 16
                          ? "bg-red-500"
                          : hpPercentage < 51
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
                  <span className="mt-1 max-w-24 block text-[10px] text-neutral-500">
                    Radiation day/night rates + waves
                  </span>
                </div>
                <div className="flex min-w-14 flex-col items-center gap-2">
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
