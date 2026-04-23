import type { LoadedRaster, PreprocessParams } from "../../types/workspace";

export type ScaleOptions = {
  maxEdge: number;
};

function clampByte(v: number) {
  return Math.max(0, Math.min(255, v));
}

function contrastFactor(contrast: number) {
  const c = Math.max(-100, Math.min(100, contrast));
  return (259 * (c + 255)) / (255 * (259 - c));
}

function parseHexColor(hex: string) {
  const v = hex.trim().replace(/^#/, "");
  if (v.length === 3) {
    const r = parseInt(v[0] + v[0], 16);
    const g = parseInt(v[1] + v[1], 16);
    const b = parseInt(v[2] + v[2], 16);
    if (![r, g, b].every(Number.isFinite)) return null;
    return { r, g, b };
  }
  if (v.length === 6) {
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    if (![r, g, b].every(Number.isFinite)) return null;
    return { r, g, b };
  }
  return null;
}

export async function fileToLoadedRaster(file: File, opts: ScaleOptions): Promise<LoadedRaster> {
  return blobToLoadedRaster(file, file.name, opts);
}

export async function blobToLoadedRaster(blob: Blob, name: string, opts: ScaleOptions): Promise<LoadedRaster> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, opts.maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  bitmap.close();

  return {
    name,
    width,
    height,
    imageData,
  };
}

export function preprocessImageData(src: ImageData, params: PreprocessParams): ImageData {
  const out = new ImageData(src.width, src.height);

  const { mode, invert, threshold, contrast, addBackground, backgroundRemoval, edgeEnhance, denoise } = params;
  const f = contrastFactor(contrast);
  const bg = addBackground ? parseHexColor(addBackground) : null;
  const bgR = bg?.r ?? 255;
  const bgG = bg?.g ?? 255;
  const bgB = bg?.b ?? 255;

  const d = out.data;
  const s = src.data;

  if (mode === "none") {
    for (let i = 0; i < s.length; i += 4) {
      const r0 = s[i] ?? 0;
      const g0 = s[i + 1] ?? 0;
      const b0 = s[i + 2] ?? 0;
      const a0 = (s[i + 3] ?? 255) / 255;
      const r = Math.round(r0 * a0 + bgR * (1 - a0));
      const g = Math.round(g0 * a0 + bgG * (1 - a0));
      const b = Math.round(b0 * a0 + bgB * (1 - a0));
      d[i] = invert ? 255 - r : r;
      d[i + 1] = invert ? 255 - g : g;
      d[i + 2] = invert ? 255 - b : b;
      d[i + 3] = 255;
    }
    return out;
  }

  const gray = new Uint8ClampedArray(src.width * src.height);

  for (let i = 0, p = 0; i < s.length; i += 4, p++) {
    const r0 = s[i] ?? 0;
    const g0 = s[i + 1] ?? 0;
    const b0 = s[i + 2] ?? 0;
    const a0 = (s[i + 3] ?? 255) / 255;
    const r = r0 * a0 + bgR * (1 - a0);
    const g = g0 * a0 + bgG * (1 - a0);
    const b = b0 * a0 + bgB * (1 - a0);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const cLum = clampByte(f * (lum - 128) + 128);

    const bg = Math.max(0, Math.min(1, backgroundRemoval));
    const bgLift = Math.round(bg * Math.max(0, cLum - 200) * 1.8);
    gray[p] = clampByte(cLum + bgLift);
  }

  let work = gray;

  if (denoise > 0) {
    work = boxBlur(work, src.width, src.height, denoise);
  }

  if (edgeEnhance > 0) {
    work = sharpen(work, src.width, src.height, edgeEnhance);
  }

  if (invert) {
    for (let p = 0; p < work.length; p++) {
      work[p] = 255 - (work[p] ?? 0);
    }
  }

  const t = Math.max(0, Math.min(255, threshold));

  if (mode === "binary") {
    for (let p = 0, i = 0; p < work.length; p++, i += 4) {
      const v = work[p] >= t ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
  } else {
    for (let p = 0, i = 0; p < work.length; p++, i += 4) {
      const v = work[p] ?? 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
  }

  return out;
}

function boxBlur(src: Uint8ClampedArray, w: number, h: number, strength: number) {
  const a = Math.max(0, Math.min(1, strength));
  const iters = Math.max(1, Math.round(a * 2));
  let cur = src;

  for (let iter = 0; iter < iters; iter++) {
    const out = new Uint8ClampedArray(cur.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let count = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue;
            sum += cur[ny * w + nx] ?? 0;
            count++;
          }
        }
        out[y * w + x] = Math.round(sum / Math.max(1, count));
      }
    }
    cur = out;
  }

  return cur;
}

function sharpen(src: Uint8ClampedArray, w: number, h: number, strength: number) {
  const a = Math.max(0, Math.min(1, strength));
  const out = new Uint8ClampedArray(src.length);

  const center = 1 + a * 4;
  const side = -a;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const c = src[idx] ?? 0;
      const l = x > 0 ? (src[idx - 1] ?? c) : c;
      const r = x + 1 < w ? (src[idx + 1] ?? c) : c;
      const u = y > 0 ? (src[idx - w] ?? c) : c;
      const d = y + 1 < h ? (src[idx + w] ?? c) : c;
      const v = center * c + side * (l + r + u + d);
      out[idx] = clampByte(v);
    }
  }

  return out;
}
