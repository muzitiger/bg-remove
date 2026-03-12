import React, { useState, useRef, useCallback } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-8 border-white select-none cursor-col-resize"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      {/* Before image (full) */}
      <img
        src={beforeSrc}
        alt="Before: original image with background"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* After image (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `polygon(${position}% 0, 100% 0, 100% 100%, ${position}% 100%)` }}
      >
        {/* Checkered transparency pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            backgroundColor: "#f8fafc",
          }}
        />
        <img
          src={afterSrc}
          alt="After: background removed"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl z-10"
        style={{ left: `${position}%` }}
      >
        {/* Slider handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white size-10 rounded-full flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-sm">unfold_more_double</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase z-10">
        {beforeLabel}
      </div>
      <div className="absolute bottom-6 right-6 bg-primary/90 backdrop-blur text-white px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase z-10">
        {afterLabel}
      </div>
    </div>
  );
}
