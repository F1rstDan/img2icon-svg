declare module "imagetracerjs" {
  export type ImageTracerOptions = Record<string, unknown>;
  const ImageTracer: {
    imagedataToSVG: (imageData: ImageData, options?: ImageTracerOptions) => string;
  };
  export default ImageTracer;
}
