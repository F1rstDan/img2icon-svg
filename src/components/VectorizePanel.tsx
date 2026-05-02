import { ArrowLeftRight } from "lucide-react";
import SliderField from "./SliderField";
import type { VectorizeParams } from "../types/workspace";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type Props = {
  params: VectorizeParams;
  onChange: (patch: Partial<VectorizeParams>) => void;
  disabled: boolean;
};

export default function VectorizePanel({
  params,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="rounded-2xl bg-zinc-950/50 p-5 ring-1 ring-white/10">
      <div className="text-sm text-zinc-200">SVG导出参数</div>
      <div className="mt-4 space-y-5">
        <div className="grid grid-cols-12 items-end gap-3">
          <div className="col-span-5">
            <div className="text-xs text-zinc-300">背景色</div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={params.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="h-9 w-10 cursor-pointer rounded-lg bg-transparent"
                disabled={disabled}
              />
              <input
                type="text"
                value={params.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="h-9 w-full rounded-xl bg-zinc-900/70 px-3 text-sm text-zinc-100 ring-1 ring-white/10"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="col-span-2 flex justify-center">
            <button
              type="button"
              onClick={() => onChange({ backgroundColor: params.foregroundColor, foregroundColor: params.backgroundColor })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900/70 ring-1 ring-white/10 hover:bg-zinc-900"
              aria-label="交换颜色"
              disabled={disabled}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>
          <div className="col-span-5">
            <div className="text-xs text-zinc-300">主体色</div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={params.foregroundColor}
                onChange={(e) => onChange({ foregroundColor: e.target.value })}
                className="h-9 w-10 cursor-pointer rounded-lg bg-transparent"
                disabled={disabled}
              />
              <input
                type="text"
                value={params.foregroundColor}
                onChange={(e) => onChange({ foregroundColor: e.target.value })}
                className="h-9 w-full rounded-xl bg-zinc-900/70 px-3 text-sm text-zinc-100 ring-1 ring-white/10"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="col-span-12">
            <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/10 bg-zinc-900/70 text-emerald-400 ring-1 ring-white/10"
                checked={params.noBackground}
                onChange={(e) => onChange({ noBackground: e.target.checked })}
                disabled={disabled}
              />
              <span>不需要 SVG 背景色</span>
            </label>
          </div>
        </div>

        <SliderField
          label="节点数量"
          valueLabel={`${Math.round(params.nodeDensity * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          value={params.nodeDensity}
          onChange={(v) => onChange({ nodeDensity: clamp01(v) })}
          disabled={disabled}
        />
        <SliderField
          label="平滑"
          valueLabel={`${Math.round(params.smoothing * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          value={params.smoothing}
          onChange={(v) => onChange({ smoothing: clamp01(v) })}
          disabled={disabled}
        />
        <SliderField
          label="斑点过滤"
          valueLabel={`${Math.round(params.speckleFilter * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          value={params.speckleFilter}
          onChange={(v) => onChange({ speckleFilter: clamp01(v) })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
