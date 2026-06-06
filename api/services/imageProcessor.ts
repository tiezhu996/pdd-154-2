import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface ImageProcessResult {
  width: number;
  height: number;
  dominantColors: string[];
  thumbnailPath: string;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

async function extractDominantColors(inputPath: string, colorCount: number = 5): Promise<string[]> {
  try {
    const { data, info } = await sharp(inputPath)
      .resize(50, 50, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels: [number, number, number][] = [];
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (info.channels >= 3 && r !== undefined && g !== undefined && b !== undefined) {
        pixels.push([r, g, b]);
      }
    }

    if (pixels.length === 0) {
      return ['#666666', '#888888', '#aaaaaa', '#cccccc', '#eeeeee'];
    }

    const buckets = new Map<string, { color: [number, number, number]; count: number }>();
    for (const [r, g, b] of pixels) {
      const key = `${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.color[0] += r;
        existing.color[1] += g;
        existing.color[2] += b;
        existing.count++;
      } else {
        buckets.set(key, { color: [r, g, b], count: 1 });
      }
    }

    const sorted = Array.from(buckets.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, colorCount);

    return sorted.map((item) =>
      rgbToHex(
        item.color[0] / item.count,
        item.color[1] / item.count,
        item.color[2] / item.count
      )
    );
  } catch (err) {
    console.warn('Failed to extract colors:', err);
    return ['#666666', '#888888', '#aaaaaa', '#cccccc', '#eeeeee'];
  }
}

export async function processImage(
  inputPath: string,
  originalName: string,
  uploadsDir: string
): Promise<ImageProcessResult> {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const ext = path.extname(originalName);
  const thumbnailName = `${id}_thumb.jpg`;
  const thumbnailPath = path.join(uploadsDir, 'thumbnails', thumbnailName);
  const thumbnailUrl = `/uploads/thumbnails/${thumbnailName}`;

  const metadata = await sharp(inputPath).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  await sharp(inputPath)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 85 })
    .toFile(thumbnailPath);

  const dominantColors = await extractDominantColors(inputPath, 5);

  return {
    width,
    height,
    dominantColors,
    thumbnailPath: thumbnailUrl,
  };
}

export async function moveFile(
  tempPath: string,
  uploadsDir: string,
  originalName: string
): Promise<{ filePath: string; fileUrl: string }> {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const ext = path.extname(originalName);
  const fileName = `${id}${ext}`;
  const destPath = path.join(uploadsDir, 'assets', fileName);
  const fileUrl = `/uploads/assets/${fileName}`;

  await fs.promises.rename(tempPath, destPath);

  return {
    filePath: destPath,
    fileUrl,
  };
}
