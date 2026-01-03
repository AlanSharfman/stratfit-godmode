// src/components/TakeTheTourButton.tsx
import { Play } from "lucide-react";

interface TakeTheTourButtonProps {
  onClick: () => void;
}

export default function TakeTheTourButton({ onClick }: TakeTheTourButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        group flex items-center gap-2
        rounded-md border border-slate-600/40
        bg-black/50 backdrop-blur-sm
        px-4 py-2
        transition-all duration-300
        hover:border-cyan-400/60
        hover:bg-cyan-950/30
        hover:text-cyan-400
        hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]
      "
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <Play 
        size={14} 
        className="fill-slate-400 transition-colors group-hover:fill-cyan-400" 
      />
      <span className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 group-hover:text-cyan-400">
        TAKE THE TOUR
      </span>
    </button>
  );
}
