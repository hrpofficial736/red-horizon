import { useState } from "react";
import { MODULES } from "../game/modules/moduleDefinitions";
import { MAT_ICONS } from "../game/utils/matetialsIcons";
import {
  hasOperationalPower,
  isCriticalPowerModule,
  useGameStore,
} from "../store/useGameStore";
import { RepairButton } from "./RepairButton";
import { StatsComponent } from "./StatsComponent";

const formatResource = (resource: string) =>
  resource
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function HabitatComponent({ instanceId }: { instanceId: string }) {
  const [showStats, setShowStats] = useState(false);
  const placedModule = useGameStore((state) =>
    state.placedModules.find((module) => module.instanceId === instanceId),
  );
  const config = placedModule ? MODULES[placedModule.id] : undefined;
  const hasPowerSurplus = useGameStore((state) => {
    return hasOperationalPower(
      state.placedModules,
      state.powerBankCharge,
      state.currentHour,
    );
  });

  if (!placedModule || !config) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        Module telemetry is unavailable.
      </div>
    );
  }

  if (showStats) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 justify-end">
          <button
            onClick={() => setShowStats(false)}
            className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:border-white"
          >
            Back to Habitat
          </button>
        </div>
        <StatsComponent />
      </div>
    );
  }

  const hpPercentage = Math.round(
    (placedModule.hp / config.maxIntegrity) * 100,
  );
  const displayedHp = Math.round(placedModule.hp);
  const isActive =
    placedModule.active &&
    placedModule.hp > 0 &&
    (isCriticalPowerModule(placedModule.id) || hasPowerSurplus);
  const hasProduction =
    (config.productionInputs?.length ?? 0) > 0 ||
    (config.productionOutputs?.length ?? 0) > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 text-white">
      <div className="flex shrink-0 justify-end">
        <button
          onClick={() => setShowStats(true)}
          className="rounded-full border border-orange-500/50 bg-orange-950/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-orange-200 transition hover:border-orange-300 hover:bg-orange-900/50"
        >
          View All Module Stats
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto">
        <section className="rounded-2xl bg-black/55 p-5 ">
          <div className="mb-5 flex items-start justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-orange-400">
                MODULE TELEMETRY
              </span>
              <h3 className="mt-1 text-2xl font-bold uppercase">
                {config.name}
              </h3>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${
                isActive
                  ? "border-green-500/50 bg-green-950/50 text-green-300"
                  : "border-red-500/50 bg-red-950/50 text-red-300"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-neutral-400">Health</span>
                <strong>
                  {displayedHp} / {config.maxIntegrity} HP ({hpPercentage}%)
                </strong>
              </div>
              <div className="h-2 overflow-hidden rounded bg-neutral-800">
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

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <span className="block text-[10px] uppercase text-neutral-500">
                  Power draw
                </span>
                <strong
                  className={
                    config.powerDraw < 0 ? "text-red-300" : "text-green-300"
                  }
                >
                  {config.powerDraw > 0 ? "+" : ""}
                  {config.powerDraw} EU/h
                </strong>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <span className="block text-[10px] uppercase text-neutral-500">
                  Radiation exposure
                </span>
                <strong className="text-amber-300">
                  Day/night rates + waves
                </strong>
              </div>
            </div>

            {/*<div className="text-xs text-neutral-400">
              Grid position: ({placedModule.x}, {placedModule.y})
            </div>*/}
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-4">
          <div className="rounded-2xl bg-black/55 p-5">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-white">
              Production / Hour
            </h4>
            {!hasProduction ? (
              <p className="text-xs italic text-neutral-500">
                No resource transformation configured.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {config.productionInputs?.map((rate) => (
                  <div
                    key={`input-${rate.resource}`}
                    className="flex items-center justify-between text-red-300"
                  >
                    <span className="flex items-center gap-2">
                      {MAT_ICONS[rate.resource] && (
                        <img
                          src={MAT_ICONS[rate.resource]}
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      {formatResource(rate.resource)}
                    </span>
                    <strong>-{rate.amountPerTick}/h</strong>
                  </div>
                ))}
                {config.productionOutputs?.map((rate) => (
                  <div
                    key={`output-${rate.resource}`}
                    className="flex items-center justify-between text-green-300"
                  >
                    <span className="flex items-center gap-2">
                      {MAT_ICONS[rate.resource] && (
                        <img
                          src={MAT_ICONS[rate.resource]}
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      {formatResource(rate.resource)}
                    </span>
                    <strong>+{rate.amountPerTick}/h</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-black/55 p-4">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-white">
              Maintenance
            </h4>
            <RepairButton moduleInstance={placedModule} />
          </div>
        </section>
      </div>
    </div>
  );
}
