import React from "react";
import { useGameStore } from "../store/useGameStore";
import { MODULES } from "../game/modules/moduleDefinitions"; // Import data configurations to find maxIntegrity details

export const MaintenancePanel: React.FC = () => {
  // 1. Pull the placed buildings list and the execution actions from the store
  const placedModules = useGameStore((state) => state.placedModules);
  const repairModule = useGameStore((state) => state.repairModule);
  const repairKitCount = useGameStore(
    (state) => state.inventory.repair_kit || 0,
  );

  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "2px solid #333",
        color: "#fff",
        padding: 20,
        borderRadius: 12,
        fontFamily: "monospace",
        maxWidth: "500px",
        margin: "20px auto",
      }}
    >
      <h2
        style={{
          color: "#ff9f43",
          borderBottom: "1px solid #333",
          paddingBottom: "8px",
          margin: 0,
        }}
      >
        🔧 SYSTEM INTEGRITY & MAINTENANCE
      </h2>
      <p style={{ fontSize: "12px", color: "#aaa" }}>
        Available Repair Kits: <strong>{repairKitCount}</strong>
      </p>

      {placedModules.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>
          No structural modules placed yet. Open Build Menu to deploy assets.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {placedModules.map((mod) => {
            const config = MODULES[mod.id];
            const maxHp = config ? config.maxIntegrity : 100;
            const displayedHp = Math.round(mod.hp);
            const hpPercentage = Math.round((mod.hp / maxHp) * 100);

            // Visual indicators for danger zones
            let statusColor = "#6bbf4e"; // Healthy Green
            if (hpPercentage < 51) statusColor = "#ffa500"; // Warn Orange
            if (hpPercentage < 16) statusColor = "#ff4d4d"; // Danger Red

            return (
              <div
                key={mod.instanceId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#262626",
                  padding: "12px",
                  borderRadius: 6,
                  borderLeft: `4px solid ${statusColor}`,
                }}
              >
                <div>
                  <strong style={{ fontSize: "14px" }}>
                    {config?.name || mod.id}
                  </strong>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#aaa",
                      marginTop: "4px",
                    }}
                  >
                    Grid Pos: ({mod.x}, {mod.y}) | HP:{" "}
                    <span style={{ color: statusColor, fontWeight: "bold" }}>
                      {displayedHp}/{maxHp} ({hpPercentage}%)
                    </span>
                  </div>
                  {mod.hp === 0 && (
                    <span
                      style={{
                        display: "inline-block",
                        background: "#ff4d4d",
                        color: "#fff",
                        fontSize: "9px",
                        padding: "2px 6px",
                        borderRadius: 4,
                        marginTop: "4px",
                        textTransform: "uppercase",
                        fontWeight: "bold",
                      }}
                    >
                      ⚠️ SYSTEM CRIPPLED
                    </span>
                  )}
                </div>

                <button
                  disabled={mod.hp === maxHp || repairKitCount < 1}
                  onClick={() => {
                    const success = repairModule(mod.instanceId);
                    if (success) {
                      alert(
                        `${config?.name || "Module"} restored successfully to full integrity!`,
                      );
                    } else {
                      alert(
                        "Failed to repair. Ensure you have a Repair Kit available in your bag inventory.",
                      );
                    }
                  }}
                  style={{
                    background:
                      mod.hp === maxHp
                        ? "#444"
                        : repairKitCount < 1
                          ? "#553333"
                          : "#ff9f43",
                    color: mod.hp === maxHp ? "#888" : "#000",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: 4,
                    cursor:
                      mod.hp === maxHp || repairKitCount < 1
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  {mod.hp === maxHp ? "Fully Tuned" : "🔧 Repair"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
