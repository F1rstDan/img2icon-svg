import ImageTracer from "imagetracerjs";
import type { VectorizeParams, VectorizeResult } from "../../types/workspace";
import { analyzeSvg } from "../svg/analyze";
import { sanitizeAndLayerSvg } from "../svg/sanitize";

export function vectorizeToSvg(imageData: ImageData, params: VectorizeParams): VectorizeResult {
  const density = Math.max(0, Math.min(1, params.nodeDensity));
  const smoothing = Math.max(0, Math.min(1, params.smoothing));
  const speckle = Math.max(0, Math.min(1, params.speckleFilter));

  const pathomit = Math.round(2 + (1 - density) * 28 + speckle * 18);
  const ltres = 1 + (1 - density) * 18;
  const qtres = 1 + (1 - density) * 18;
  const blurradius = smoothing * 2.2;
  const blurdelta = 20 + smoothing * 40;

  const svgRaw = ImageTracer.imagedataToSVG(imageData, {
    numberofcolors: 2,
    colorsampling: 0,
    colorquantcycles: 1,
    ltres,
    qtres,
    pathomit,
    blurradius,
    blurdelta,
    strokewidth: 0,
    linefilter: speckle >= 0.4,
    scale: 1,
    roundcoords: 2,
    viewbox: true,
    desc: false,
    lcpr: 0,
    qcpr: 0,
    rightangleenhance: true,
    mincolorratio: 0,
  });

  const svgText = sanitizeAndLayerSvg(svgRaw, {
    backgroundColor: params.backgroundColor,
    foregroundColor: params.foregroundColor,
  });
  const { pathCount, estimatedNodeCount } = analyzeSvg(svgText);
  return { svgText, pathCount, estimatedNodeCount };
}
