export interface CompressOptions {
  /** Max output width in px (keeps aspect ratio). */
  maxWidth?: number;
  /** Max output height in px (keeps aspect ratio). */
  maxHeight?: number;
  /** JPEG/WebP quality 0..1. Ignored for PNG output (lossless). */
  quality?: number;
  /** Skip entirely if the file is already at or under this size (bytes). */
  skipUnderBytes?: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Downscale + re-encode an image entirely in the browser BEFORE upload, so the
 * stored/served file is light and loads fast in the app. PNGs keep their format
 * (transparency preserved, resized only — ideal for logos/icons); every other
 * type is re-encoded as JPEG.
 *
 * Fail-safe: returns the original file untouched on any error, when it's
 * already small, or when compression wouldn't actually shrink it.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    skipUnderBytes = 0,
  } = opts;

  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml") return file; // vector — nothing to resize
  if (skipUnderBytes && file.size <= skipUnderBytes) return file;

  try {
    const url = URL.createObjectURL(file);
    let img: HTMLImageElement;
    try {
      img = await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const isPng = file.type === "image/png";
    const outType = isPng ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, outType, isPng ? undefined : quality)
    );
    // No blob, or re-encode didn't help → keep the original.
    if (!blob || blob.size >= file.size) return file;

    const ext = isPng ? "png" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return new File([blob], name, { type: outType, lastModified: Date.now() });
  } catch {
    return file;
  }
}
