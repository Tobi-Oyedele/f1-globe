"use client";

import { useState, useCallback, useRef } from "react";
import Globe from "@/components/Globe";
import Tooltip from "@/components/Tooltip";
import { Race } from "@/data/races";

export default function Home() {
  const [tooltip, setTooltip] = useState<{
    race: Race | null;
    x: number;
    y: number;
    visible: boolean;
  }>({ race: null, x: 0, y: 0, visible: false });

  const lastUpdate = useRef(0);

  const handleMarkerHover = useCallback(
    (race: Race | null, x: number, y: number) => {
      const now = performance.now();
      if (now - lastUpdate.current < 30) return; // max ~33 updates/sec
      lastUpdate.current = now;

      if (race) {
        setTooltip({ race, x, y, visible: true });
      } else {
        setTooltip((prev) => ({ ...prev, visible: false }));
      }
    },
    [],
  );

  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <Globe onMarkerHover={handleMarkerHover} />
      <Tooltip
        race={tooltip.race}
        x={tooltip.x}
        y={tooltip.y}
        visible={tooltip.visible}
      />
    </main>
  );
}
