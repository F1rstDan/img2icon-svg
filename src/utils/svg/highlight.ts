function isCommand(t: string) {
  return /^[a-zA-Z]$/.test(t);
}

function tokenizePath(d: string) {
  const tokens: string[] = [];
  d.replace(/([a-zA-Z])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g, (m) => {
    tokens.push(m);
    return m;
  });
  return tokens;
}

export function extractPathNodes(d: string) {
  const tokens = tokenizePath(d);
  const pts: Array<{ x: number; y: number }> = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;

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
    if (!cmd) {
      i++;
      continue;
    }

    const lower = cmd.toLowerCase();
    const rel = cmd === lower;

    if (lower === "m") {
      const nx = nextNum();
      const ny = nextNum();
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
        cmd = "";
        continue;
      }
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
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
        cmd = "";
        continue;
      }
      x = rel ? x + nx : nx;
      y = rel ? y + ny : ny;
      pts.push({ x, y });
      continue;
    }

    if (lower === "h") {
      const nx = nextNum();
      if (!Number.isFinite(nx)) {
        cmd = "";
        continue;
      }
      x = rel ? x + nx : nx;
      pts.push({ x, y });
      continue;
    }

    if (lower === "v") {
      const ny = nextNum();
      if (!Number.isFinite(ny)) {
        cmd = "";
        continue;
      }
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
      if (![x1, y1, x2, y2, x3, y3].every(Number.isFinite)) {
        cmd = "";
        continue;
      }
      const ex = rel ? x + x3 : x3;
      const ey = rel ? y + y3 : y3;
      x = ex;
      y = ey;
      pts.push({ x, y });
      continue;
    }

    if (lower === "s") {
      const x2 = nextNum();
      const y2 = nextNum();
      const x3 = nextNum();
      const y3 = nextNum();
      if (![x2, y2, x3, y3].every(Number.isFinite)) {
        cmd = "";
        continue;
      }
      const ex = rel ? x + x3 : x3;
      const ey = rel ? y + y3 : y3;
      x = ex;
      y = ey;
      pts.push({ x, y });
      continue;
    }

    if (lower === "q") {
      const x1 = nextNum();
      const y1 = nextNum();
      const x2 = nextNum();
      const y2 = nextNum();
      if (![x1, y1, x2, y2].every(Number.isFinite)) {
        cmd = "";
        continue;
      }
      const ex = rel ? x + x2 : x2;
      const ey = rel ? y + y2 : y2;
      x = ex;
      y = ey;
      pts.push({ x, y });
      continue;
    }

    if (lower === "t") {
      const x2 = nextNum();
      const y2 = nextNum();
      if (![x2, y2].every(Number.isFinite)) {
        cmd = "";
        continue;
      }
      const ex = rel ? x + x2 : x2;
      const ey = rel ? y + y2 : y2;
      x = ex;
      y = ey;
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
      if (![rx, ry, rot, laf, sf, x2, y2].every(Number.isFinite)) {
        cmd = "";
        continue;
      }
      x = rel ? x + x2 : x2;
      y = rel ? y + y2 : y2;
      pts.push({ x, y });
      continue;
    }

    cmd = "";
  }

  return pts;
}

export function applyNodeHighlight(svg: SVGSVGElement) {
  svg.querySelectorAll("[data-nodes='true']").forEach((n) => n.remove());

  const vb = svg
    .getAttribute("viewBox")
    ?.trim()
    .split(/\s+/)
    .map((v) => parseFloat(v));
  const w = vb && vb.length === 4 ? vb[2] : 1000;
  const h = vb && vb.length === 4 ? vb[3] : 1000;
  const r = Math.max(1.2, Math.min(w, h) / 140);

  const ns = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(ns, "g");
  g.setAttribute("data-nodes", "true");
  g.setAttribute("fill", "#22d3ee");
  g.setAttribute("stroke", "none");
  g.setAttribute("opacity", "0.95");

  const paths = Array.from(svg.querySelectorAll("path"));
  for (const p of paths) {
    const d = p.getAttribute("d");
    if (!d) continue;
    const pts = extractPathNodes(d);
    const t = p.getAttribute("transform");
    const pg = document.createElementNS(ns, "g");
    if (t) pg.setAttribute("transform", t);
    for (const pt of pts) {
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", `${pt.x}`);
      c.setAttribute("cy", `${pt.y}`);
      c.setAttribute("r", `${r}`);
      pg.appendChild(c);
    }
    g.appendChild(pg);
  }

  svg.appendChild(g);
}
