import React from "react";
import { Settings } from "lucide-react";
import { getPowerBankCapacity, useGameStore } from "../store/useGameStore";

interface BaseStatusHUDProps {
    onOpenMenu: () => void;
}

export const BaseStatusHUD: React.FC<BaseStatusHUDProps> = ({ onOpenMenu }) => {
    const currentDay = useGameStore((state) => state.currentDay);
    const currentHour = useGameStore((state) => state.currentHour);
    const currentMinute = useGameStore((state) => state.currentMinute);
    const astronautHealth = useGameStore((state) => state.astronautHealth);
    const oxygenSpO2 = useGameStore((state) => state.oxygenSpO2);
    const fatigueLevel = useGameStore((state) => state.fatigueLevel);
    const sleepUntilMorning = useGameStore((state) => state.sleepUntilMorning);
    const isFainted = useGameStore((state) => state.isFainted);

    const powerBankCharge = useGameStore((state) => state.powerBankCharge);
    const placedModules = useGameStore((state) => state.placedModules);
    const powerBankCapacity = getPowerBankCapacity(placedModules);
    const formattedHour = String(currentHour).padStart(2, "0");
    const formattedMinute = String(currentMinute).padStart(2, "0");
    const oxygenDisplay = Math.min(
        oxygenSpO2 >= 90
            ? oxygenSpO2 +
            Math.sin((currentDay * 1440 + currentHour * 60 + currentMinute) / 8) *
            0.4
            : oxygenSpO2, 100);

    const healthColor =
        astronautHealth < 30
            ? "text-red-500 font-bold"
            : "text-green-400 font-bold";
    const oxygenColor =
        oxygenSpO2 < 90
            ? "text-red-400 font-bold"
            : oxygenSpO2 < 94
                ? "text-amber-300 font-bold"
                : "text-cyan-300 font-bold";

    return (
        <div className="absolute top-4 right-4 z-20 bg-neutral-950/90 border border-neutral-800 text-white p-4 rounded-xl min-w-74 backdrop-blur shadow-2xl pointer-events-auto">
            <div className="mb-2 flex items-start justify-between border-b border-neutral-800 pb-2">
                <div className="flex w-full flex-col justify-between gap-0.5">
                    <h3 className="text-lg font-orbitron font-bold tracking-widest text-white uppercase">
                        Sol {String(currentDay).padStart(2, "0")}
                    </h3>
                    <span className="text-5xl text-white font-bold tracking-wider">
                        {formattedHour}:{formattedMinute}
                    </span>
                </div>
                <button
                    type="button"
                    aria-label="Open mission menu"
                    title="Mission menu"
                    onClick={onOpenMenu}
                    className="rounded-md p-1 text-white bg-neutral-800 hover:bg-neutral-700 hover:text-white"
                >
                    <Settings size={22} />
                </button>
            </div>
            <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                    <span className="text-neutral-200 font-semibold">VITALS HP</span>
                    <span className={healthColor}>{astronautHealth.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-neutral-200 font-semibold">SpO2</span>
                    <span className={oxygenColor}>{oxygenDisplay.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-neutral-200 font-semibold">EXHAUSTION</span>
                    <span className="text-amber-400 font-bold">{fatigueLevel} / 100</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-neutral-200 font-semibold">POWER BANK</span>
                    <span
                        className={`font-bold ${powerBankCapacity > 0 && powerBankCharge / powerBankCapacity < 0.2
                                ? "text-red-400"
                                : "text-green-400"
                            }`}
                    >
                        {Math.round(powerBankCharge)} / {powerBankCapacity} EU
                    </span>
                </div>
                {currentHour >= 21 && currentHour < 23 && (
                    <div className="border-t border-neutral-800 pt-2 mt-2 space-y-1.5">
                        {/* <div className="text-[10px] text-amber-300">
              TIRED WINDOW: {overtimeHours}/2 overtime hours
            </div> */}
                        <button
                            onClick={sleepUntilMorning}
                            className="w-full rounded-full border border-green-700 bg-green-950/60 px-2 py-1.5 text-md font-bold text-green-300 hover:bg-green-900"
                        >
                            SLEEP NOW
                        </button>
                        {/* <button
              onClick={workOvertime}
              className="w-full rounded border border-orange-700 bg-orange-950/60 px-2 py-1.5 text-[10px] font-bold text-orange-300 hover:bg-orange-900"
            >
              WORK 1 MORE HOUR
            </button> */}
                    </div>
                )}
                {isFainted && (
                    <div className="border-t border-neutral-800 pt-2 mt-2 text-center text-[10px] font-bold text-red-400">
                        FAINTED FROM EXHAUSTION
                    </div>
                )}
                {/* <div className="flex justify-between border-t border-neutral-800 pt-2 mt-2">
          <span className="text-neutral-400">REPAIR KITS:</span>
          <span className="text-white font-bold">{repairKitCount} units</span>
        </div> */}
            </div>
        </div>
    );
};
