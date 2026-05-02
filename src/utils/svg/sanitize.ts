function normalizeFill(fill: string) {
  const f = fill.trim().toLowerCase();
  if (!f) return "";
  if (f === "none") return "none";
  return f.replace(/\s+/g, "");
}

function getElementFill(el: Element) {
  const fillAttr = el.getAttribute("fill");
  if (fillAttr) return normalizeFill(fillAttr);
  const style = el.getAttribute("style") ?? "";
  const m = style.match(/fill\s*:\s*([^;]+)/i);
  return m ? normalizeFill(m[1] ?? "") : "";
}

function parseRgb(fill: string) {
  const f = normalizeFill(fill);
  if (!f || f === "none") return null;
  if (f.startsWith("rgb(") || f.startsWith("rgba(")) {
    const nums = f
      .replace(/^rgba?\(|\)$/g, "")
      .split(",")
      .map((v) => parseFloat(v));
    const r = nums[0];
    const g = nums[1];
    const b = nums[2];
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) return { r, g, b };
    return null;
  }
  if (f.startsWith("#")) {
    const hex = f.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    return null;
  }
  if (f === "white") return { r: 255, g: 255, b: 255 };
  if (f === "black") return { r: 0, g: 0, b: 0 };
  return null;
}

function luminance(rgb: { r: number; g: number; b: number }) {
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

function toNumbers(viewBox: string | null) {
  const vb = viewBox?.trim().split(/\s+/).map((v) => parseFloat(v));
  if (!vb || vb.length !== 4 || !vb.every((n) => Number.isFinite(n))) return null;
  return vb as [number, number, number, number];
}

function extractPathNodes(d: string) {
  const tokens: string[] = [];
  d.replace(/([a-zA-Z])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g, (m) => {
    tokens.push(m);
    return m;
  });

  const pts: Array<{ x: number; y: number }> = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;

  function isCommand(t: string) {
    return /^[a-zA-Z]$/.test(t);
  }

  function nextNum() {
    const t = tokens[i++];
    return t ? parseFloat(t) : NaN;
  }

  while (i < tokens.length) {
    const t = tokens[i] ?? "";
    if (isCommand(t)) {
      cmd = t;
      i++;
    }
    if (!cmd) break;

    const lower = cmd.toLowerCase();
    const rel = cmd === lower;

    if (lower === "m") {
      const nx = nextNum();
      const ny = nextNum();
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) break;
      x = rel ? x + nx : nx;
      y = rel ? y + ny : ny;
      sx = x;
      sy = y;
      pts.push({ x, y });
      cmd = rel ? "l" : "L";
      continue;
    }

    if (lower === "z") {
      x = sx;
      y = sy;
      pts.push({ x, y });
      cmd = "";
      continue;
    }

    if (lower === "l") {
      const nx = nextNum();
      const ny = nextNum();
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) break;
      x = rel ? x + nx : nx;
      y = rel ? y + ny : ny;
      pts.push({ x, y });
      continue;
    }

    if (lower === "h") {
      const nx = nextNum();
      if (!Number.isFinite(nx)) break;
      x = rel ? x + nx : nx;
      pts.push({ x, y });
      continue;
    }

    if (lower === "v") {
      const ny = nextNum();
      if (!Number.isFinite(ny)) break;
      y = rel ? y + ny : ny;
      pts.push({ x, y });
      continue;
    }

    if (lower === "c") {
      const x1 = nextNum();
      const y1 = nextNum();
      const x2 = nextNum();
      const y2 = nextNum();
      const x3 = nextNum();
      const y3 = nextNum();
      if (![x1, y1, x2, y2, x3, y3].every(Number.isFinite)) break;
      x = rel ? x + x3 : x3;
      y = rel ? y + y3 : y3;
      pts.push({ x, y });
      continue;
    }

    if (lower === "s") {
      const x2 = nextNum();
      const y2 = nextNum();
      const x3 = nextNum();
      const y3 = nextNum();
      if (![x2, y2, x3, y3].every(Number.isFinite)) break;
      x = rel ? x + x3 : x3;
      y = rel ? y + y3 : y3;
      pts.push({ x, y });
      continue;
    }

    if (lower === "q") {
      const x1 = nextNum();
      const y1 = nextNum();
      const x2 = nextNum();
      const y2 = nextNum();
      if (![x1, y1, x2, y2].every(Number.isFinite)) break;
      x = rel ? x + x2 : x2;
      y = rel ? y + y2 : y2;
      pts.push({ x, y });
      continue;
    }

    if (lower === "t") {
      const x2 = nextNum();
      const y2 = nextNum();
      if (![x2, y2].every(Number.isFinite)) break;
      x = rel ? x + x2 : x2;
      y = rel ? y + y2 : y2;
      pts.push({ x, y });
      continue;
    }

    if (lower === "a") {
      const rx = nextNum();
      const ry = nextNum();
      const rot = nextNum();
      const laf = nextNum();
      const sf = nextNum();
      const x2 = nextNum();
      const y2 = nextNum();
      if (![rx, ry, rot, laf, sf, x2, y2].every(Number.isFinite)) break;
      x = rel ? x + x2 : x2;
      y = rel ? y + y2 : y2;
      pts.push({ x, y });
      continue;
    }

    break;
  }

  return pts;
}

function bboxAreaForElements(els: Element[]) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let has = false;

  for (const el of els) {
    const d = el.getAttribute("d");
    if (!d) continue;
    const pts = extractPathNodes(d);
    for (const p of pts) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      has = true;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  if (!has) return null;
  const w = Math.max(0, maxX - minX);
  const h = Math.max(0, maxY - minY);
  return w * h;
}

function normalizeColor(c: string | undefined, fallback: string) {
  const v = (c ?? "").trim();
  return v ? v : fallback;
}

export function sanitizeAndLayerSvg(
  svgRaw: string,
  opts?: {
    backgroundColor?: string | null;
    foregroundColor?: string;
  },
) {
  const backgroundColor = opts?.backgroundColor === null ? null : normalizeColor(opts?.backgroundColor, "#000000");
  const foregroundColor = normalizeColor(opts?.foregroundColor, "#ffffff");
  const doc = new DOMParser().parseFromString(svgRaw, "image/svg+xml");
  const srcSvg = doc.querySelector("svg");
  if (!srcSvg) throw new Error("Invalid SVG");

  srcSvg.querySelectorAll("script, foreignObject, iframe, object").forEach((n) => n.remove());

  const ns = "http://www.w3.org/2000/svg";
  const outSvg = doc.createElementNS(ns, "svg");
  outSvg.setAttribute("xmlns", ns);
  const viewBox = srcSvg.getAttribute("viewBox");
  if (viewBox) {
    outSvg.setAttribute("viewBox", viewBox);
  } else {
    const w = srcSvg.getAttribute("width");
    const h = srcSvg.getAttribute("height");
    if (w && h) outSvg.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
  }
  outSvg.setAttribute("preserveAspectRatio", srcSvg.getAttribute("preserveAspectRatio") ?? "xMidYMid meet");

  const defs = Array.from(srcSvg.querySelectorAll(":scope > defs"));
  defs.forEach((d) => outSvg.appendChild(d.cloneNode(true)));

  const paths = Array.from(srcSvg.querySelectorAll("path"));
  const groups = new Map<string, Element[]>();

  for (const p of paths) {
    const fill = getElementFill(p);
    if (fill === "none") continue;
    const key = fill || "default";
    const arr = groups.get(key) ?? [];
    const cloned = p.cloneNode(true) as Element;
    cloned.removeAttribute("style");
    cloned.setAttribute("fill", foregroundColor);
    cloned.removeAttribute("stroke");
    cloned.removeAttribute("stroke-width");
    arr.push(cloned);
    groups.set(key, arr);
  }

  const vbNums = toNumbers(outSvg.getAttribute("viewBox"));
  const vbArea = vbNums ? vbNums[2] * vbNums[3] : null;

  const candidates = Array.from(groups.entries())
    .map(([key, els]) => {
      const bboxArea = bboxAreaForElements(els);
      const areaRatio = bboxArea != null && vbArea ? bboxArea / vbArea : null;
      const rgb = parseRgb(key);
      const lum = rgb ? luminance(rgb) : 128;
      return { key, els, bboxArea, areaRatio, lum };
    })
    .filter((c) => c.els.length > 0);

  candidates.sort((a, b) => {
    const arA = a.areaRatio ?? 1;
    const arB = b.areaRatio ?? 1;
    if (arA !== arB) return arA - arB;
    return a.lum - b.lum;
  });

  let chosenKey: string | null = null;
  for (const c of candidates) {
    if (c.areaRatio != null && c.areaRatio > 0.88) continue;
    chosenKey = c.key;
    break;
  }
  if (!chosenKey && candidates.length > 0) chosenKey = candidates[0]?.key ?? null;

  const vb = vbNums;
  if (vb && backgroundColor != null) {
    const rect = doc.createElementNS(ns, "rect");
    rect.setAttribute("x", `${vb[0]}`);
    rect.setAttribute("y", `${vb[1]}`);
    rect.setAttribute("width", `${vb[2]}`);
    rect.setAttribute("height", `${vb[3]}`);
    rect.setAttribute("fill", backgroundColor);
    outSvg.appendChild(rect);
  }

  const layerRoot = doc.createElementNS(ns, "g");
  layerRoot.setAttribute("data-layered", "true");
  layerRoot.setAttribute("fill", foregroundColor);

  const entries = Array.from(groups.entries()).filter(([k]) => (chosenKey ? k === chosenKey : true));
  entries.forEach(([fill, els], idx) => {
    const g = doc.createElementNS(ns, "g");
    g.setAttribute("id", `layer-${idx + 1}`);
    g.setAttribute("data-fill", fill);
    els.forEach((el) => g.appendChild(el));
    layerRoot.appendChild(g);
  });

  outSvg.appendChild(layerRoot);

  const serializer = new XMLSerializer();
  return serializer.serializeToString(outSvg);
}
