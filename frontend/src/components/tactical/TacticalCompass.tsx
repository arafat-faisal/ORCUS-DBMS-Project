"use client";

import React from "react";

interface TacticalCompassProps {
  heading?: string; // e.g. "NW"
  degrees?: number; // e.g. 315
}

export const TacticalCompass: React.FC<TacticalCompassProps> = ({
  heading = "NW",
  degrees = 315,
}) => {
  return (
    <div className="w-24 h-24 rounded-full bg-[#111319] border-2 border-neutral-800 relative flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_4px_15px_rgba(0,0,0,0.5)]">
      {/* Outer Dial Marks */}
      <div className="absolute inset-1 rounded-full border border-neutral-700/40" />

      {/* Compass Crosshairs */}
      <div className="absolute w-[80%] h-[1px] bg-neutral-800" />
      <div className="absolute h-[80%] w-[1px] bg-neutral-800" />

      {/* Rotating Dial Needle */}
      <div
        className="absolute w-full h-full flex items-center justify-center transition-transform duration-700"
        style={{ transform: `rotate(${degrees}deg)` }}
      >
        {/* Glowing Orange Arrow pointing North */}
        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[20px] border-b-amber-500 absolute top-2 filter drop-shadow-[0_0_6px_#f59e0b]" />
        {/* Gray opposite pointer */}
        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[14px] border-t-neutral-600 absolute bottom-3" />
      </div>

      {/* Center Readout */}
      <div className="relative z-10 flex flex-col items-center justify-center bg-[#151821] w-10 h-10 rounded-full border border-neutral-700 shadow-sm">
        <span className="font-mono-code text-xs font-bold text-white tracking-wider">
          {heading}
        </span>
      </div>
    </div>
  );
};
