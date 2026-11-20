import { describe, expect, it } from "vitest";
import {
  PRODUCTION_API_MEDIA_URL,
  PRODUCTION_STORAGE_MEDIA_URL,
  resolveProductionMediaUrl,
} from "../../src/utils/mediaUrl";

describe("production media URL", () => {
  it("moves DEV API media URLs to production", () => {
    expect(
      resolveProductionMediaUrl(
        "https://api-dev.maestroswim.com/media/career/cv.pdf",
      ),
    ).toBe(`${PRODUCTION_API_MEDIA_URL}/media/career/cv.pdf`);
  });

  it("moves local proxy media URLs to production", () => {
    expect(
      resolveProductionMediaUrl(
        "http://opx.localhost:3001/__api/media/career/cv.pdf?download=1",
      ),
    ).toBe(`${PRODUCTION_API_MEDIA_URL}/media/career/cv.pdf?download=1`);
  });

  it("uses production storage for file keys", () => {
    expect(resolveProductionMediaUrl("career/certificates/coaching.pdf")).toBe(
      `${PRODUCTION_STORAGE_MEDIA_URL}/career/certificates/coaching.pdf`,
    );
  });

  it("does not rewrite non-media links", () => {
    expect(resolveProductionMediaUrl("mailto:coach@example.com")).toBe(
      "mailto:coach@example.com",
    );
  });
});
