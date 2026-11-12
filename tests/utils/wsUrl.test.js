import { afterEach, describe, expect, it, vi } from "vitest";
import { buildWsUrl } from "../../src/utils/wsUrl";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("WebSocket URL configuration", () => {
  it("uses VITE_API_WS on a dev deployment independently of the HTTP API", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "admin.dev.maestroswim.com",
        host: "admin.dev.maestroswim.com",
        protocol: "https:",
      },
    });
    vi.stubEnv("VITE_API_URL", "https://api-dev.maestroswim.com");
    vi.stubEnv("VITE_API_WS", "wss://api-dev.maestroswim.com");

    expect(buildWsUrl("/ws/schedule/?branch=1")).toBe(
      "wss://api-dev.maestroswim.com/ws/schedule/?branch=1",
    );
  });

  it("builds the configured secure schedule WebSocket URL", () => {
    vi.stubEnv("VITE_API_WS", "wss://api-dev.maestroswim.com");

    expect(buildWsUrl("/ws/schedule/?branch=1")).toBe(
      "wss://api-dev.maestroswim.com/ws/schedule/?branch=1",
    );
  });
});
