import { describe, expect, it } from "vitest";
import {
  DEV_DEPLOYMENT_API_URL,
  isDevDeploymentHost,
  resolveAccessApiBaseUrl,
  resolveApiBaseUrl,
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
});
