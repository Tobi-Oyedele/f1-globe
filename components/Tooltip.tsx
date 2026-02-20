import { Race } from "@/data/races";

interface TooltipProps {
  race: Race | null;
  x: number;
  y: number;
  visible: boolean;
}

export default function Tooltip({ race, x, y, visible }: TooltipProps) {
  if (!race) return null;

  return (
    <div
      className={`fixed z-50 pointer-events-none transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ left: x, top: y }}
    >
      <div className="bg-[rgba(10,10,10,0.92)] backdrop-blur-xl border border-[rgba(225,6,0,0.15)] rounded-xl px-5 py-4 min-w-60 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(225,6,0,0.05)]">
        <p className="text-[9px] font-medium tracking-[3px] uppercase text-[#e10600] mb-2">
          Round {race.round}
        </p>
        <p className="text-xl font-light text-white mb-0.5 tracking-tight">
          {race.country}
        </p>
        <p className="text-[10px] font-light text-white/35 mb-2.5 tracking-wide leading-relaxed">
          {race.name}
        </p>
        <p className="text-xs font-normal text-white/60 pt-2.5 border-t border-white6">
          {race.date} 2026
        </p>
      </div>
    </div>
  );
}
