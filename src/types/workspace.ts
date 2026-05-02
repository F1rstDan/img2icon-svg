export type PreprocessParams = {
  mode: "none" | "grayscale" | "binary";
  invert: boolean;
  threshold: number;
  contrast: number;
  addBackground: string | null;
  backgroundRemoval: number;
  edgeEnhance: number;
  denoise: number;
};

export type VectorizeParams = {
  nodeDensity: number;
  smoothing: number;
  speckleFilter: number;
  noBackground: boolean;
  backgroundColor: string;
  foregroundColor: string;
};

export type VectorizeResult = {
  svgText: string;
  pathCount: number;
  estimatedNodeCount: number;
};

export type LoadedRaster = {
  name: string;
  width: number;
  height: number;
  imageData: ImageData;
};
