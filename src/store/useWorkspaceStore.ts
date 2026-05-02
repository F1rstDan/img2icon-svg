import { create } from "zustand";
import type { LoadedRaster, PreprocessParams, VectorizeParams, VectorizeResult } from "../types/workspace";
import { preprocessImageData } from "../utils/image/preprocess";
import { vectorizeToSvg } from "../utils/vectorize/trace";

type WorkspaceState = {
  raster: LoadedRaster | null;
  preprocessed: ImageData | null;
  preprocessParams: PreprocessParams;
  vectorizeParams: VectorizeParams;
  result: VectorizeResult | null;
  isPreprocessing: boolean;
  isVectorizing: boolean;
  error: string | null;
  setRaster: (raster: LoadedRaster | null) => void;
  setPreprocessParams: (patch: Partial<PreprocessParams>) => void;
  setVectorizeParams: (patch: Partial<VectorizeParams>) => void;
  runPreprocess: () => void;
  runVectorize: () => void;
  clearResult: () => void;
};

const defaultPreprocess: PreprocessParams = {
  mode: "binary",
  invert: false,
  threshold: 160,
  contrast: 12,
  addBackground: null,
  backgroundRemoval: 0.18,
  edgeEnhance: 0.28,
  denoise: 0.12,
};

const defaultVectorize: VectorizeParams = {
  nodeDensity: 0.6,
  smoothing: 0.25,
  speckleFilter: 0.2,
  noBackground: true,
  backgroundColor: "#000000",
  foregroundColor: "#ffffff",
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  raster: null,
  preprocessed: null,
  preprocessParams: defaultPreprocess,
  vectorizeParams: defaultVectorize,
  result: null,
  isPreprocessing: false,
  isVectorizing: false,
  error: null,
  setRaster: (raster) => {
    set({ raster, result: null, error: null });
    if (raster) {
      let hasAlpha = false;
      const data = raster.imageData.data;
      for (let i = 3; i < data.length; i += 64) {
        if ((data[i] ?? 255) < 255) {
          hasAlpha = true;
          break;
        }
      }
      const nextPreprocess = {
        ...get().preprocessParams,
        addBackground: hasAlpha ? "#000000" : null,
      };
      set({ preprocessParams: nextPreprocess });

      set({ isPreprocessing: true });
      try {
        const preprocessed = preprocessImageData(raster.imageData, nextPreprocess);
        set({ preprocessed });
      } catch (e) {
        set({ error: e instanceof Error ? e.message : "预处理失败" });
      } finally {
        set({ isPreprocessing: false });
      }
    } else {
      set({ preprocessed: null });
    }
  },
  setPreprocessParams: (patch) => set({ preprocessParams: { ...get().preprocessParams, ...patch } }),
  setVectorizeParams: (patch) => set({ vectorizeParams: { ...get().vectorizeParams, ...patch } }),
  runPreprocess: () => {
    const { raster, preprocessParams } = get();
    if (!raster) return;
    set({ isPreprocessing: true, error: null });
    try {
      const preprocessed = preprocessImageData(raster.imageData, preprocessParams);
      set({ preprocessed });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "预处理失败" });
    } finally {
      set({ isPreprocessing: false });
    }
  },
  runVectorize: () => {
    const { preprocessed, vectorizeParams } = get();
    if (!preprocessed) return;
    set({ isVectorizing: true, error: null });
    try {
      const result = vectorizeToSvg(preprocessed, vectorizeParams);
      set({ result });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "矢量化失败" });
    } finally {
      set({ isVectorizing: false });
    }
  },
  clearResult: () => set({ result: null }),
}));
