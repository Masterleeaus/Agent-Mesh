import { describe, expect, it } from "vitest";
import {
  prepareAssessmentPhoto,
  type AssessmentPhotoCanvasAdapter,
} from "../prepare-assessment-photo";

function adapter(width: number, height: number, encodedSize: number): AssessmentPhotoCanvasAdapter & {
  calls: Array<{ width: number; height: number; quality: number }>;
} {
  const calls: Array<{ width: number; height: number; quality: number }> = [];
  return {
    calls,
    async decode() {
      return { source: {} as CanvasImageSource, width, height };
    },
    async encode(_source, nextWidth, nextHeight, quality) {
      calls.push({ width: nextWidth, height: nextHeight, quality });
      return new Blob([new Uint8Array(encodedSize)], { type: "image/jpeg" });
    },
  };
}

describe("prepareAssessmentPhoto", () => {
  it("caps the longest dimension at 1400px and uses donor-derived JPEG quality", async () => {
    const canvas = adapter(2800, 1400, 400);
    const file = new File([new Uint8Array(1000)], "site.png", { type: "image/png", lastModified: 123 });

    const result = await prepareAssessmentPhoto(file, canvas);

    expect(canvas.calls).toEqual([{ width: 1400, height: 700, quality: 0.82 }]);
    expect(result.name).toBe("site.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBe(400);
    expect(result.lastModified).toBe(123);
  });

  it("keeps unsupported image formats on Titan's existing upload path", async () => {
    const canvas = adapter(3000, 2000, 100);
    const file = new File([new Uint8Array(1000)], "site.heic", { type: "image/heic" });

    expect(await prepareAssessmentPhoto(file, canvas)).toBe(file);
    expect(canvas.calls).toHaveLength(0);
  });

  it("keeps the original when compression does not reduce payload size", async () => {
    const canvas = adapter(1200, 800, 1200);
    const file = new File([new Uint8Array(1000)], "site.jpg", { type: "image/jpeg" });

    expect(await prepareAssessmentPhoto(file, canvas)).toBe(file);
    expect(canvas.calls).toEqual([{ width: 1200, height: 800, quality: 0.82 }]);
  });

  it("falls back to the original when browser decoding fails", async () => {
    const failing: AssessmentPhotoCanvasAdapter = {
      async decode() { throw new Error("decode failed"); },
      async encode() { throw new Error("should not run"); },
    };
    const file = new File([new Uint8Array(1000)], "site.webp", { type: "image/webp" });

    expect(await prepareAssessmentPhoto(file, failing)).toBe(file);
  });
});
