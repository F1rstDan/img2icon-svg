import Segmented from "./Segmented";
import ZoomPan from "./ZoomPan";
import CanvasPreview from "./CanvasPreview";
import SvgPreview from "./SvgPreview";
import type { LoadedRaster } from "../types/workspace";
import { cn } from "../lib/utils";

export type PreviewTab = "原图" | "预处理" | "SVG" | "对比";

type Props = {
  tab: PreviewTab;
  onTabChange: (t: PreviewTab) => void;
  raster: LoadedRaster | null;
  preprocessed: ImageData | null;
  svgText: string | null;
  highlightNodes: boolean;
  onHighlightNodesChange: (v: boolean) => void;
  backgroundColor: string;
};

export default function PreviewArea({
  tab,
  onTabChange,
  raster,
  preprocessed,
  svgText,
  highlightNodes,
  onHighlightNodesChange,
  backgroundColor,
}: Props) {
  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={tab}
          onChange={onTabChange}
          options={[
            { value: "对比", label: "对比" },
            { value: "原图", label: "原图" },
            { value: "预处理", label: "预处理" },
            { value: "SVG", label: "SVG" },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!svgText}
            onClick={() => onHighlightNodesChange(!highlightNodes)}
            className={cn(
              "rounded-xl px-3 py-2 text-xs ring-1 transition",
              !svgText ? "bg-zinc-900/40 text-zinc-500 ring-white/5" : "",
              svgText && highlightNodes
                ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/25 hover:bg-emerald-400/20"
                : "bg-zinc-900/70 text-zinc-200 ring-white/10 hover:bg-zinc-900",
            )}
          >
            节点高亮
          </button>
          <div className="text-xs text-zinc-400">滚轮缩放，拖拽平移</div>
        </div>
      </div>

      <div className="mt-4 grid h-[72vh] grid-cols-12 gap-4">
        {tab === "对比" ? (
          <>
            <div className="col-span-12 lg:col-span-6">
              <ZoomPan resetKey={raster?.name ?? "empty"}>
                <CanvasPreview imageData={raster?.imageData ?? null} className="block" />
              </ZoomPan>
              <div className="mt-2 text-xs text-zinc-400">原图（缩放后用于处理）</div>
            </div>
            <div className="col-span-12 lg:col-span-6">
              <ZoomPan resetKey={`${raster?.name ?? "empty"}-pp`}>
                {svgText ? (
                  <div className="overflow-hidden rounded-xl" style={{ backgroundColor }}>
                    <SvgPreview svgText={svgText} highlightNodes={highlightNodes} />
                  </div>
                ) : (
                  <CanvasPreview imageData={preprocessed} className="block" />
                )}
              </ZoomPan>
              <div className="mt-2 text-xs text-zinc-400">{svgText ? "SVG 结果" : "预处理结果"}</div>
            </div>
          </>
        ) : null}

        {tab === "原图" ? (
          <div className="col-span-12">
            <ZoomPan resetKey={raster?.name ?? "empty"}>
              <CanvasPreview imageData={raster?.imageData ?? null} className="block" />
            </ZoomPan>
          </div>
        ) : null}

        {tab === "预处理" ? (
          <div className="col-span-12">
            <ZoomPan resetKey={`${raster?.name ?? "empty"}-pp`}>
              <CanvasPreview imageData={preprocessed} className="block" />
            </ZoomPan>
          </div>
        ) : null}

        {tab === "SVG" ? (
          <div className="col-span-12">
            <ZoomPan resetKey={`${raster?.name ?? "empty"}-svg`}>
              {svgText ? (
                <div className="overflow-hidden rounded-xl" style={{ backgroundColor }}>
                  <SvgPreview svgText={svgText} highlightNodes={highlightNodes} />
                </div>
              ) : null}
            </ZoomPan>
          </div>
        ) : null}
      </div>
    </div>
  );
}
