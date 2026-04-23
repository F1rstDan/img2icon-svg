import Segmented from "./Segmented";
import SliderField from "./SliderField";
import type { PreprocessParams } from "../types/workspace";
import { cn } from "../lib/utils";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type Props = {
  rasterLoaded: boolean;
  params: PreprocessParams;
  onChange: (patch: Partial<PreprocessParams>) => void;
};

export default function PreprocessPanel({ rasterLoaded, params, onChange }: Props) {
  const processed = params.mode !== "none";
  const bgEnabled = !!params.addBackground;
  const bgValue = params.addBackground ?? "#000000";

  return (
    <div className="rounded-2xl bg-zinc-950/50 p-5 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-200">预处理</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ invert: !params.invert })}
            className={cn(
              "rounded-xl px-3 py-2 text-sm ring-1 transition",
              params.invert
                ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/25 hover:bg-emerald-400/20"
                : "bg-zinc-900/70 text-zinc-200 ring-white/10 hover:bg-zinc-900",
            )}
          >
            反相
          </button>
          <Segmented
            value={params.mode}
            onChange={(v) => onChange({ mode: v })}
            options={[
              { value: "none", label: "不处理" },
              { value: "binary", label: "二值" },
              { value: "grayscale", label: "灰度" },
            ]}
          />
        </div>
      </div>
      <div className="mt-5 space-y-5">
        <SliderField
          label="阈值"
          valueLabel={`${Math.round(params.threshold)}`}
          min={0}
          max={255}
          step={1}
          value={params.threshold}
          onChange={(v) => onChange({ threshold: v })}
          disabled={!rasterLoaded || !processed}
        />
        <SliderField
          label="对比度"
          valueLabel={`${Math.round(params.contrast)}`}
          min={-60}
          max={60}
          step={1}
          value={params.contrast}
          onChange={(v) => onChange({ contrast: v })}
          disabled={!rasterLoaded || !processed}
        />
        <SliderField
          label="背景去除"
          valueLabel={`${Math.round(params.backgroundRemoval * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          value={params.backgroundRemoval}
          onChange={(v) => onChange({ backgroundRemoval: clamp01(v) })}
          disabled={!rasterLoaded || !processed}
        />
        <SliderField
          label="边缘增强"
          valueLabel={`${Math.round(params.edgeEnhance * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          value={params.edgeEnhance}
          onChange={(v) => onChange({ edgeEnhance: clamp01(v) })}
          disabled={!rasterLoaded || !processed}
        />
        <SliderField
          label="去噪"
          valueLabel={`${Math.round(params.denoise * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          value={params.denoise}
          onChange={(v) => onChange({ denoise: clamp01(v) })}
          disabled={!rasterLoaded || !processed}
        />
        <div className="grid grid-cols-12 items-end gap-3">
          <div className="col-span-12 text-xs text-zinc-400">透明通道</div>
          <div className="col-span-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-950/30 p-3 ring-1 ring-white/10">
            <div className="text-sm text-zinc-200">添加背景色</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ addBackground: null })}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs ring-1 transition",
                  !bgEnabled
                    ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/25 hover:bg-emerald-400/20"
                    : "bg-zinc-900/70 text-zinc-200 ring-white/10 hover:bg-zinc-900",
                )}
                disabled={!rasterLoaded}
              >
                不添加
              </button>
              <button
                type="button"
                onClick={() => onChange({ addBackground: bgValue })}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs ring-1 transition",
                  bgEnabled
                    ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/25 hover:bg-emerald-400/20"
                    : "bg-zinc-900/70 text-zinc-200 ring-white/10 hover:bg-zinc-900",
                )}
                disabled={!rasterLoaded}
              >
                添加
              </button>
              <input
                type="color"
                value={bgValue}
                onChange={(e) => onChange({ addBackground: e.target.value })}
                className="h-9 w-10 cursor-pointer rounded-lg bg-transparent"
                disabled={!rasterLoaded || !bgEnabled}
              />
              <input
                type="text"
                value={bgValue}
                onChange={(e) => onChange({ addBackground: e.target.value })}
                className="h-9 w-28 rounded-xl bg-zinc-900/70 px-3 text-sm text-zinc-100 ring-1 ring-white/10"
                disabled={!rasterLoaded || !bgEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
