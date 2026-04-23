import type { LoadedRaster } from "../../types/workspace";

export function createSampleRaster(): LoadedRaster {
  const w = 900;
  const h = 560;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 10;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(90, 120);
  ctx.bezierCurveTo(240, 20, 420, 40, 520, 150);
  ctx.bezierCurveTo(610, 250, 760, 220, 820, 120);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(120, 410);
  ctx.lineTo(420, 320);
  ctx.lineTo(520, 460);
  ctx.lineTo(780, 340);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font = "700 96px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("SVG", 120, 290);

  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#10b981";
  ctx.fillRect(60, 70, 240, 120);
  ctx.globalAlpha = 1;

  const imageData = ctx.getImageData(0, 0, w, h);
  return { name: "sample.png", width: w, height: h, imageData };
}
