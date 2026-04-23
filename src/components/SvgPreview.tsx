import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import { applyNodeHighlight } from "../utils/svg/highlight";

type Props = {
  svgText: string | null;
  className?: string;
  highlightNodes?: boolean;
};

export default function SvgPreview({ svgText, className, highlightNodes }: Props) {
  if (!svgText) return null;

  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const svg = root.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;
    svg.querySelectorAll("[data-nodes='true']").forEach((n) => n.remove());
    if (highlightNodes) applyNodeHighlight(svg);
  }, [svgText, highlightNodes]);

  return (
    <div
      ref={rootRef}
      className={cn("[&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: svgText }}
    />
  );
}
