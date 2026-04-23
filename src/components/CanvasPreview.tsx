import { useEffect, useRef } from "react";

type Props = {
  imageData: ImageData | null;
  className?: string;
};

export default function CanvasPreview({ imageData, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !imageData) return;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  if (!imageData) return null;
  return <canvas ref={ref} className={className} />;
}

