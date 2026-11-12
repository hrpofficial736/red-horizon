import React, { useEffect, useRef, useState } from "react";
import { REPAIR_TIME_SPEED, useGameStore } from "../store/useGameStore";

const VERY_FAST_FORWARD_SPEED = 120

export const DebugTimeSkip: React.FC = () => {
  const [isSkipping, setIsSkipping] = useState(false);
  const startPassiveTimer = useGameStore((state) => state.startPassiveTimer);
  const stopPassiveTimer = useGameStore((state) => state.stopPassiveTimer);
  const skipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedMinutesRef = useRef(0);
  const isSkippingRef = useRef(false);

  const stopSkipping = () => {
    if (skipIntervalRef.current) {
      clearInterval(skipIntervalRef.current);
      skipIntervalRef.current = null;
    }

    if (isSkippingRef.current) {
      isSkippingRef.current = false;
      setIsSkipping(false);
      startPassiveTimer();
    }
  };

  const startSkipping = (speed: number) => {
    if (isSkippingRef.current) return;
    isSkippingRef.current = true;
    setIsSkipping(true);
    elapsedMinutesRef.current = 0;

    stopPassiveTimer();

    skipIntervalRef.current = setInterval(() => {
      const store = useGameStore.getState();
      const nextMinute = store.currentMinute + 1;
      store.processOxygenMinute();

      if (nextMinute >= 60) {
        useGameStore.setState({ currentMinute: 0 });
        if (store.currentHour === 22) {
          store.workOvertime();
        } else {
          store.advanceHour(1);
        }
      } else {
        useGameStore.setState({ currentMinute: nextMinute });
      }

      elapsedMinutesRef.current += 1;
      if (elapsedMinutesRef.current >= 12 * 60) {
        stopSkipping();
      }
    }, 1000 / speed);
  };

  useEffect(
    () => () => {
      if (skipIntervalRef.current) {
        clearInterval(skipIntervalRef.current);
      }
      if (isSkippingRef.current) {
        startPassiveTimer();
      }
    },
    [startPassiveTimer],
  );

  return (
    <div className="absolute bottom-28 right-4 z-50 pointer-events-auto flex flex-col gap-2">
      {[
        { label: "⏩ FAST FORWARDS", speed: REPAIR_TIME_SPEED },
        { label: "⏩ VERY FAST FORWARD", speed: VERY_FAST_FORWARD_SPEED },
      ].map(({ label, speed }) => (
        <button
          key={label}
          onMouseDown={() => startSkipping(speed)}
          onMouseUp={stopSkipping}
          onMouseLeave={stopSkipping}
          onTouchStart={() => startSkipping(speed)}
          onTouchEnd={stopSkipping}
          className={`px-4 py-2.5 rounded-lg border-2 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-2xl select-none ${
            isSkipping
              ? "bg-red-950/40 border-red-900 text-red-500 animate-pulse cursor-not-allowed"
              : "bg-neutral-950 border-orange-500/60 text-orange-400 hover:border-orange-400 hover:bg-neutral-900 cursor-pointer active:scale-95"
          }`}
        >
          {isSkipping ? "⏩ TIME ACCELERATING..." : label}
        </button>
      ))}
    </div>
  );
};
