function countMatches(text: string, re: RegExp) {
  const m = text.match(re);
  return m ? m.length : 0;
}

export function analyzeSvg(svgText: string) {
  const pathCount = countMatches(svgText, /<path\b/gi);

  let estimatedNodeCount = 0;
  const dAttrs = svgText.match(/\sd="[^"]*"/gi) ?? [];
  for (const dAttr of dAttrs) {
    const d = dAttr.slice(3, -1);
    const cmdCount = countMatches(d, /[MmLlHhVvCcSsQqTtAa]/g);
    estimatedNodeCount += cmdCount;
  }

  return { pathCount, estimatedNodeCount };
}

