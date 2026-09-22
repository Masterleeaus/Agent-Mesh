const COMPRESSIBLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface AssessmentPhotoCanvasAdapter {
  decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }>;
  encode(source: CanvasImageSource, width: number, height: number, quality: number): Promise<Blob | null>;
}

export async function prepareAssessmentPhoto(
  file: File,
  adapter: AssessmentPhotoCanvasAdapter,
  maxPx = 1400,
  quality = 0.82,
): Promise<File> {
  if (!COMPRESSIBLE_IMAGE_TYPES.has(file.type)) return file;

  try {
    const image = await adapter.decode(file);
    if (!image.width || !image.height) return file;

    let width = image.width;
    let height = image.height;
    if (width > maxPx || height > maxPx) {
      const scale = maxPx / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const blob = await adapter.encode(image.source, width, height, quality);
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "assessment-photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export const browserAssessmentPhotoCanvas: AssessmentPhotoCanvasAdapter = {
  async decode(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      return {
        source: image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  },

  async encode(source, width, height, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(source, 0, 0, width, height);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
  },
};
