import { describe, expect, it } from "vitest";
import {
  DEV_DEPLOYMENT_API_URL,
  isDevDeploymentHost,
  resolveAccessApiBaseUrl,
  resolveApiBaseUrl,
  isLocalApiProxy,
  validateApiBaseUrl,
} from "@/utils/apiUrl";

describe("API URL resolution", () => {
  it.each([
    "admin.dev.maestroswim.com",
    "finance.dev.maestroswim.com",
    "opx.dev.maestroswim.com",
    "coach.dev.maestroswim.com",
  ])("routes %s to the development backend", (hostname) => {
    expect(resolveApiBaseUrl({ hostname, isViteDev: false })).toBe(
      DEV_DEPLOYMENT_API_URL,
    );
    expect(resolveAccessApiBaseUrl({ hostname, isViteDev: false })).toBe(
      DEV_DEPLOYMENT_API_URL,
    );
  });

  it("does not classify the production or lookalike domains as dev", () => {
    expect(isDevDeploymentHost("admin.maestroswim.com")).toBe(false);
    expect(isDevDeploymentHost("admin.dev.maestroswim.com.evil.test")).toBe(
      false,
    );
  });

  it("keeps the Vite proxy for local development", () => {
    expect(
      resolveApiBaseUrl({ hostname: "admin.localhost", isViteDev: true }),
    ).toBe("/__api");
    expect(
      resolveAccessApiBaseUrl({
        hostname: "admin.localhost",
        isViteDev: true,
      }),
    ).toBe("/__access-api");
  });

  it("uses configured URLs for non-dev deployments", () => {
    expect(
      resolveApiBaseUrl({
        hostname: "admin.maestroswim.com",
        isViteDev: false,
        envApiUrl: "https://api.maestroswim.com/",
      }),
    ).toBe("https://api.maestroswim.com");
  });

  it.each([false, true])("never uses local proxies on deployed hosts (DEV=%s)", (isViteDev) => {
    expect(resolveApiBaseUrl({ hostname: "admin.dev.maestroswim.com", isViteDev, envApiUrl: "" }))
      .toBe(DEV_DEPLOYMENT_API_URL);
    expect(resolveAccessApiBaseUrl({ hostname: "admin.dev.maestroswim.com", isViteDev, envAccessApiUrl: "https://api.maestroswim.com" }))
      .toBe(DEV_DEPLOYMENT_API_URL);
    expect(isLocalApiProxy({ hostname: "preview.netlify.app", isViteDev })).toBe(false);
  });

  it("uses the DEV environment URL on Netlify preview hosts", () => {
    expect(resolveApiBaseUrl({ hostname: "preview.netlify.app", isViteDev: true, envApiUrl: DEV_DEPLOYMENT_API_URL }))
      .toBe(DEV_DEPLOYMENT_API_URL);
  });

  it.each(["", "/", "/__api", "api.example.com", "ftp://api.example.com", "https://api.example.com?token=x"])("rejects invalid deployed API URL %s", (envApiUrl) => {
    expect(() => resolveApiBaseUrl({ hostname: "preview.netlify.app", isViteDev: false, envApiUrl })).toThrow();
    expect(() => validateApiBaseUrl(envApiUrl)).toThrow();
  });

  it("rejects the frontend host as the API target", () => {
    expect(() => resolveApiBaseUrl({ hostname: "preview.netlify.app", isViteDev: false, envApiUrl: "https://preview.netlify.app" })).toThrow(/backend/);
  });

  it("preserves production access URL overrides and fallback", () => {
    const options = { hostname: "admin.maestroswim.com", isViteDev: false, envApiUrl: "https://api.maestroswim.com/" };
    expect(resolveAccessApiBaseUrl({ ...options, envAccessApiUrl: "https://access.example.com/" })).toBe("https://access.example.com");
    expect(resolveAccessApiBaseUrl({ ...options, envAccessApiUrl: "" })).toBe("https://api.maestroswim.com");
  });
});
