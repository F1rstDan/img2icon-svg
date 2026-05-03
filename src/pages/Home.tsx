import { useEffect, useRef, useState } from "react";
import {
  Check,
  CircleHelp,
  Copy,
  Download,
  Image,
  Sparkles,
  Scan,
  Wand2,
} from "lucide-react";
import PreprocessPanel from "../components/PreprocessPanel";
import VectorizePanel from "../components/VectorizePanel";
import Segmented from "../components/Segmented";
import ZoomPan from "../components/ZoomPan";
import CanvasPreview from "../components/CanvasPreview";
import SvgPreview from "../components/SvgPreview";
import { cn } from "../lib/utils";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import {
  blobToLoadedRaster,
  fileToLoadedRaster,
} from "../utils/image/preprocess";
import { createSampleRaster } from "../utils/image/sample";
import { copyTextToClipboard } from "../utils/clipboard";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const raster = useWorkspaceStore((s) => s.raster);
  const preprocessed = useWorkspaceStore((s) => s.preprocessed);
  const preprocessParams = useWorkspaceStore((s) => s.preprocessParams);
  const vectorizeParams = useWorkspaceStore((s) => s.vectorizeParams);
  const result = useWorkspaceStore((s) => s.result);
  const isPreprocessing = useWorkspaceStore((s) => s.isPreprocessing);
  const isVectorizing = useWorkspaceStore((s) => s.isVectorizing);
  const error = useWorkspaceStore((s) => s.error);
  const setRaster = useWorkspaceStore((s) => s.setRaster);
  const setPreprocessParams = useWorkspaceStore((s) => s.setPreprocessParams);
  const setVectorizeParams = useWorkspaceStore((s) => s.setVectorizeParams);
  const runPreprocess = useWorkspaceStore((s) => s.runPreprocess);
  const runVectorize = useWorkspaceStore((s) => s.runVectorize);
  const clearResult = useWorkspaceStore((s) => s.clearResult);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const helpRef = useRef<HTMLDivElement | null>(null);
  const [preTab, setPreTab] = useState<"原图" | "预处理">("预处理");
  const [copied, setCopied] = useState(false);
  const [highlightNodes, setHighlightNodes] = useState(false);
  const [helpPinned, setHelpPinned] = useState(false);
  const [helpHover, setHelpHover] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [svgActiveScale, setSvgActiveScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState(false);

  const helpOpen = helpPinned || helpHover;

  useEffect(() => {
    if (!helpPinned) return;
    const onDown = (e: PointerEvent) => {
      const el = helpRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setHelpPinned(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [helpPinned]);

  useEffect(() => {
    if (!raster) return;
    clearResult();
    const t = window.setTimeout(() => runPreprocess(), 140);
    return () => window.clearTimeout(t);
  }, [raster, preprocessParams, runPreprocess, clearResult]);

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const blob = item.getAsFile();
        if (!blob) continue;
        e.preventDefault();
        try {
          const loaded = await blobToLoadedRaster(blob, "pasted.png", {
            maxEdge: 1600,
          });
          setRaster(loaded);
        } catch (err) {
          useWorkspaceStore.setState({
            error: err instanceof Error ? err.message : "粘贴导入失败",
          });
        }
        break;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [setRaster]);

  useEffect(() => {
    if (!preprocessed || isPreprocessing) return;
    const t = window.setTimeout(() => runVectorize(), 220);
    return () => window.clearTimeout(t);
  }, [
    preprocessed,
    isPreprocessing,
    vectorizeParams.nodeDensity,
    vectorizeParams.smoothing,
    vectorizeParams.speckleFilter,
    vectorizeParams.noBackground,
    vectorizeParams.backgroundColor,
    vectorizeParams.foregroundColor,
    runVectorize,
  ]);

  const canExport = !!result?.svgText && !isVectorizing;
  const hasRaster = !!raster;
  const showPreprocessed = preTab === "预处理";
  const contentSize = raster
    ? { width: raster.width, height: raster.height }
    : null;

  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [raster?.name]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-3xl font-semibold tracking-tight">
              单色图标转 SVG 工具
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400/10 px-3 py-1 ring-1 ring-emerald-400/20">
              <Sparkles className="h-4 w-4 text-emerald-200" />
              <div className="text-sm text-emerald-100">
                位图图标 PNG/JPG → 可编辑 SVG 矢量路径
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPreprocessing ? (
              <div className="rounded-xl bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300 ring-1 ring-white/10">
                预处理中…
              </div>
            ) : null}
            {isVectorizing ? (
              <div className="rounded-xl bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300 ring-1 ring-white/10">
                生成 SVG…
              </div>
            ) : null}
            <div
              ref={helpRef}
              className="relative"
              onMouseEnter={() => setHelpHover(true)}
              onMouseLeave={() => setHelpHover(false)}
            >
              <button
                type="button"
                onClick={() => setHelpPinned((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900/70 text-zinc-200 ring-1 ring-white/10 hover:bg-zinc-900"
                aria-label="使用说明"
              >
                <CircleHelp className="h-4 w-4" />
              </button>
              {helpOpen ? (
                <div className="absolute right-0 top-10 z-20 w-[360px] rounded-2xl bg-zinc-950/90 p-4 text-sm text-zinc-200 ring-1 ring-white/10 backdrop-blur">
                  <div className="text-sm font-medium text-zinc-100">
                    使用步骤
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-zinc-300">
                    <div>1. 拖入 / 粘贴 / 选择一张图片</div>
                    <div>2. 左侧调预处理（阈值、去背景、边缘增强…）</div>
                    <div>3. 右侧自动生成 SVG，调节点密度与平滑</div>
                    <div>4. 复制或下载 SVG</div>
                  </div>
                  <div className="mt-4 text-sm font-medium text-zinc-100">
                    工具特色
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-zinc-300">
                    <div>- 自动生成：导入后即出 SVG</div>
                    <div>- 可控输出：节点数量 / 平滑 / 斑点过滤</div>
                    <div>- 便捷导出：一键复制与下载</div>
                    <div>- 节点高亮：快速检查路径节点</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-5 lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isVectorizing}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm ring-1 transition disabled:cursor-not-allowed disabled:opacity-60",
                    !raster
                      ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/25 hover:bg-emerald-400/20"
                      : "bg-zinc-900/70 text-zinc-100 ring-white/10 hover:bg-zinc-900",
                  )}
                >
                  <Image className="mr-2 inline-block h-4 w-4 align-[-0.15em]" />
                  选择文件
                </button>
                <button
                  type="button"
                  disabled={isVectorizing}
                  onClick={() => setRaster(createSampleRaster())}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900/70 px-3 py-2 text-sm text-zinc-300 ring-1 ring-white/10 hover:bg-zinc-900 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4 text-emerald-200" />
                  载入示例图
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.currentTarget.value = "";
                    if (!file) return;
                    try {
                      const loaded = await fileToLoadedRaster(file, {
                        maxEdge: 1600,
                      });
                      setRaster(loaded);
                    } catch (err) {
                      setRaster(null);
                      useWorkspaceStore.setState({
                        error: err instanceof Error ? err.message : "加载失败",
                      });
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                {raster ? (
                  <div className="px-1 font-mono text-xs text-zinc-400">
                    {raster.width}×{raster.height}
                  </div>
                ) : null}
                <Segmented
                  value={preTab}
                  onChange={(v) => setPreTab(v as "原图" | "预处理")}
                  options={[
                    { value: "原图", label: "原图" },
                    { value: "预处理", label: "预处理" },
                  ]}
                  className="text-xs"
                />
              </div>
            </div>

            <div
              className={cn(
                dragOver ? "rounded-2xl ring-2 ring-emerald-400/40" : "",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                if (isVectorizing) return;
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setDragOver(false);
                if (isVectorizing) return;
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                try {
                  const loaded = await fileToLoadedRaster(file, {
                    maxEdge: 1600,
                  });
                  setRaster(loaded);
                } catch (err) {
                  setRaster(null);
                  useWorkspaceStore.setState({
                    error: err instanceof Error ? err.message : "加载失败",
                  });
                }
              }}
            >
              <div className="h-[46vh]">
                <ZoomPan
                  resetKey={`${raster?.name ?? "empty"}-${preTab}`}
                  scale={zoomScale}
                  onScaleChange={setZoomScale}
                  translate={pan}
                  onTranslateChange={setPan}
                  contentSize={contentSize}
                  hasContent={showPreprocessed ? !!preprocessed : !!raster}
                  emptyHint={
                    raster ? null : <div>拖入图片或者黏贴图片到此处</div>
                  }
                >
                  {showPreprocessed ? (
                    <CanvasPreview imageData={preprocessed} className="block" />
                  ) : (
                    <CanvasPreview
                      imageData={raster?.imageData ?? null}
                      className="block"
                    />
                  )}
                </ZoomPan>
              </div>
            </div>

            <PreprocessPanel
              rasterLoaded={hasRaster}
              params={preprocessParams}
              onChange={(patch) => setPreprocessParams(patch)}
            />
          </div>

          <div className="col-span-12 space-y-5 lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canExport}
                  onClick={async () => {
                    if (!result?.svgText) return;
                    try {
                      await copyTextToClipboard(result.svgText);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 900);
                    } catch {
                      useWorkspaceStore.setState({
                        error: "复制失败：浏览器未授予剪贴板权限",
                      });
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 transition disabled:cursor-not-allowed disabled:opacity-60",
                    canExport
                      ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/25 hover:bg-emerald-400/20"
                      : "bg-zinc-900/70 text-zinc-100 ring-white/10 hover:bg-zinc-900",
                  )}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-200" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "已复制" : "复制 SVG"}
                </button>
                <button
                  type="button"
                  disabled={!canExport}
                  onClick={() => {
                    if (!result?.svgText) return;
                    const name = (raster?.name ?? "vector").replace(
                      /\.[^.]+$/,
                      "",
                    );
                    downloadText(`${name}.svg`, result.svgText);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 transition disabled:cursor-not-allowed disabled:opacity-60",
                    canExport
                      ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/25 hover:bg-emerald-400/20"
                      : "bg-zinc-900/70 text-zinc-100 ring-white/10 hover:bg-zinc-900",
                  )}
                >
                  <Download className="h-4 w-4" />
                  下载 SVG
                </button>
              </div>

              <div className="flex items-center gap-2">
                {result ? (
                  <div className="px-1 font-mono text-xs text-zinc-400">
                    路径 {result.pathCount} · 节点≈{result.estimatedNodeCount}
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={!result?.svgText}
                  onClick={() => setHighlightNodes(!highlightNodes)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs ring-1 transition",
                    !result?.svgText
                      ? "bg-zinc-900/40 text-zinc-500 ring-white/5"
                      : "",
                    result?.svgText && highlightNodes
                      ? "bg-emerald-400/15 text-emerald-100 ring-emerald-400/25 hover:bg-emerald-400/20"
                      : "bg-zinc-900/70 text-zinc-200 ring-white/10 hover:bg-zinc-900",
                  )}
                >
                  <Scan className="mr-2 inline-block h-4 w-4 align-[-0.15em]" />
                  节点高亮
                </button>
              </div>
            </div>

            <div className="h-[46vh]">
              <ZoomPan
                resetKey={`${raster?.name ?? "empty"}-svg`}
                scale={zoomScale}
                onScaleChange={setZoomScale}
                onActiveScaleChange={setSvgActiveScale}
                translate={pan}
                onTranslateChange={setPan}
                contentSize={contentSize}
                hasContent={!!result?.svgText}
              >
                {result?.svgText ? (
                  <div
                    className="overflow-hidden rounded-xl"
                    style={{
                      backgroundColor: vectorizeParams.backgroundColor,
                      width: contentSize?.width,
                      height: contentSize?.height,
                    }}
                  >
                    <SvgPreview
                      svgText={result.svgText}
                      highlightNodes={highlightNodes}
                      nodeScale={svgActiveScale}
                    />
                  </div>
                ) : null}
              </ZoomPan>
            </div>

            <VectorizePanel
              params={vectorizeParams}
              onChange={(patch) => setVectorizeParams(patch)}
              disabled={!preprocessed || isPreprocessing || isVectorizing}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-orange-400/10 p-4 text-sm text-orange-100 ring-1 ring-orange-400/25">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
