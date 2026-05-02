import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

function resizeNearest(src, width, height) {
  const dst = new PNG({ width, height })
  const sxRatio = src.width / width
  const syRatio = src.height / height

  for (let y = 0; y < height; y++) {
    const sy = Math.min(src.height - 1, Math.floor(y * syRatio))
    for (let x = 0; x < width; x++) {
      const sx = Math.min(src.width - 1, Math.floor(x * sxRatio))
      const srcIdx = (sy * src.width + sx) * 4
      const dstIdx = (y * width + x) * 4
      dst.data[dstIdx] = src.data[srcIdx]
      dst.data[dstIdx + 1] = src.data[srcIdx + 1]
      dst.data[dstIdx + 2] = src.data[srcIdx + 2]
      dst.data[dstIdx + 3] = src.data[srcIdx + 3]
    }
  }

  return dst
}

function writePng(png, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, PNG.sync.write(png))
}

const root = path.resolve(import.meta.dirname, '..')
const inputPath = path.join(root, 'public/img2icon-svg.png')
const outDir = path.join(root, 'public')

const src = PNG.sync.read(fs.readFileSync(inputPath))

writePng(resizeNearest(src, 192, 192), path.join(outDir, 'pwa-192.png'))
writePng(resizeNearest(src, 512, 512), path.join(outDir, 'pwa-512.png'))
writePng(resizeNearest(src, 180, 180), path.join(outDir, 'apple-touch-icon.png'))
