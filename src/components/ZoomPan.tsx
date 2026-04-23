import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";

type Props = {
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
  resetKey?: string | number;
  scale?: number;
  onScaleChange?: (next: number) => void;
  translate?: { x: number; y: number };
  onTranslateChange?: (next: { x: number; y: number }) => void;
  contentSize?: { width: number; height: number } | null;
  hasContent?: boolean;
  emptyHint?: React.ReactNode;
};

export default function ZoomPan({
  className,
  contentClassName,
  children,
  resetKey,
  scale: controlledScale,
  onScaleChange,
  translate: controlledTranslate,
  onTranslateChange,
  contentSize,
  hasContent,
  emptyHint,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [drag, setDrag] = useState<{
    x: number;
    y: number;
    tx: number;
    ty: number;
  } | null>(null);

  useEffect(() => {
    if (!controlledTranslate) {
      setTx(0);
      setTy(0);
    }
    if (controlledScale == null) setZoom(1);
  }, [resetKey]);

  useEffect(() => {
    if (controlledScale == null) return;
    setZoom(controlledScale);
  }, [controlledScale]);

  useEffect(() => {
    if (!controlledTranslate) return;
    setTx(controlledTranslate.x);
    setTy(controlledTranslate.y);
  }, [controlledTranslate?.x, controlledTranslate?.y]);

  useEffect(() => {
    const el = rootRef.current;
    const w = contentSize?.width ?? 0;
    const h = contentSize?.height ?? 0;
    if (!el || !w || !h) {
      setFitScale(1);
      return;
    }

    function compute() {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!cw || !ch) return;
      const next = Math.min(cw / w, ch / h);
      setFitScale(Number.isFinite(next) && next > 0 ? next : 1);
    }

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentSize?.width, contentSize?.height]);

  const activeZoom = controlledScale ?? zoom;
  const activeScale = fitScale * activeZoom;
  const transform = useMemo(
    () => `translate(${tx}px, ${ty}px) scale(${activeScale})`,
    [tx, ty, activeScale],
  );

  const scaleOptions = useMemo(() => {
    const base = [0.5, 1, 1.5, 2, 3];
    const found = base.some((v) => Math.abs(v - activeZoom) < 0.001);
    const list = found ? base : [activeZoom, ...base];
    return list.map((v) => ({
      value: v,
      label: `${Math.round(v * 100)}%`,
    }));
  }, [activeZoom]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-full w-full select-none overflow-hidden rounded-2xl bg-zinc-950/40 ring-1 ring-white/10",
        className,
      )}
      onWheel={(e) => {
        e.preventDefault();
        const el = rootRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        const delta = -e.deltaY;
        const nextZoom = Math.max(
          0.2,
          Math.min(8, activeZoom * (delta > 0 ? 1.08 : 0.92)),
        );
        const nextScale = fitScale * nextZoom;

        const k = nextScale / activeScale;
        const ntx = cx - (cx - tx) * k;
        const nty = cy - (cy - ty) * k;
        setZoom(nextZoom);
        onScaleChange?.(nextZoom);
        setTx(ntx);
        setTy(nty);
        onTranslateChange?.({ x: ntx, y: nty });
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        setDrag({ x: e.clientX, y: e.clientY, tx, ty });
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        setDrag(null);
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        const ntx = drag.tx + dx;
        const nty = drag.ty + dy;
        setTx(ntx);
        setTy(nty);
        onTranslateChange?.({ x: ntx, y: nty });
      }}
    >
      <div
        className={cn(
          "absolute inset-0 z-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:16px_16px]",
        )}
      />
      <div
        className="absolute right-3 top-3 z-30 flex items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            onScaleChange?.(1);
            setTx(0);
            setTy(0);
            onTranslateChange?.({ x: 0, y: 0 });
          }}
          className="rounded-lg bg-zinc-900/70 px-2 py-1 text-xs text-zinc-200 ring-1 ring-white/10 hover:bg-zinc-900"
        >
          复位
        </button>
        <select
          value={`${activeZoom}`}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isFinite(v)) return;
            setZoom(v);
            onScaleChange?.(v);
          }}
          className="rounded-lg bg-zinc-900/70 px-2 py-1 font-mono text-xs text-zinc-300 ring-1 ring-white/10"
        >
          {scaleOptions.map((opt) => (
            <option key={`${opt.value}`} value={`${opt.value}`}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div
          className={cn("origin-center", contentClassName)}
          style={{ transform }}
        >
          {children}
        </div>
      </div>
      {!hasContent && emptyHint ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-2xl bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300 ring-1 ring-white/10">
            {emptyHint}
          </div>
        </div>
      ) : null}
    </div>
  );
}
