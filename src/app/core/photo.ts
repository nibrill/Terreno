/**
 * Reads an image file, scales it down and re-encodes it as JPEG so photos
 * from modern phones (4–12 MB) become ~100–250 KB and many fit on the device.
 */
export async function compressPhoto(
  file: File,
  maxSide = 1280,
  quality = 0.72
): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bitmap.close();
  }
}
