import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

const auth = vi.hoisted(() => ({
  state: { access: "old-access", refresh: "refresh-token", data: {}, rememberMe: true },
  setUser: vi.fn(),
  logOut: vi.fn(),
}));
vi.mock("@/redux/slicers/authSlice", () => ({
  useAuthStore: { getState: () => auth.state },
  setUser: auth.setUser,
  logOut: auth.logOut,
}));
vi.mock("@/utils/fcm", () => ({ removeFcmToken: vi.fn() }));
vi.mock("@/utils/accessControl", () => ({ clearAccessCache: vi.fn() }));

describe("deployed API clients", () => {
  beforeEach(() => {
    vi.resetModules();
    auth.state = { access: "old-access", refresh: "refresh-token", data: {}, rememberMe: true };
    auth.setUser.mockReset();
    auth.logOut.mockReset();
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_URL", "https://api.maestroswim.com");
    vi.stubEnv("VITE_ACCESS_API_URL", "https://api.maestroswim.com");
    vi.stubGlobal("window", { location: { hostname: "admin.dev.maestroswim.com" } });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends login and access management to DEV without changing payload or auth headers", async () => {
    const { axiosConfig, axiosAccessMutationConfig } = await import("@/axios/config");
    const requests = [];
    const adapter = async (config) => {
      requests.push({ url: axios.getUri(config), data: config.data, headers: config.headers });
      return { status: 200, data: { access: "new-access" }, config };
    };
    axiosConfig.defaults.adapter = adapter;
    axiosAccessMutationConfig.defaults.adapter = adapter;
    const { login } = await import("@/axios/auth/auth");
    const credentials = { username: "test-user", password: "test-password" };
    await login(credentials);
    await axiosAccessMutationConfig.get("/auth/roles/");
    expect(requests.map(({ url }) => url)).toEqual([
      "https://api-dev.maestroswim.com/auth/users/login_v2/",
      "https://api-dev.maestroswim.com/auth/roles/",
    ]);
    expect(JSON.parse(requests[0].data)).toEqual(credentials);
    expect(requests[1].headers.Authorization).toBe("Bearer old-access");
    expect(requests[0].headers.has("ngrok-skip-browser-warning")).toBe(false);
  });

  it("refreshes on DEV and retries the original request with the new token", async () => {
    const { axiosConfig } = await import("@/axios/config");
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: { access: "new-access" } });
    const requests = [];
    axiosConfig.defaults.adapter = async (config) => {
      requests.push({ url: axios.getUri(config), token: config.headers.Authorization });
      if (!config._retry) {
        throw { config, response: { status: 401 } };
      }
      return { status: 200, data: { ok: true }, config };
    };
    // The real store updates synchronously when refresh succeeds.
    auth.setUser.mockImplementation((nextState) => { auth.state = nextState; });
    const result = await axiosConfig.get("/api/trainer/");
    expect(result.data).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledWith("https://api-dev.maestroswim.com/auth/token/refresh/", { refresh: "refresh-token" });
    expect(requests).toEqual([
      { url: "https://api-dev.maestroswim.com/api/trainer/", token: "Bearer old-access" },
      { url: "https://api-dev.maestroswim.com/api/trainer/", token: "Bearer new-access" },
    ]);
    expect(auth.logOut).not.toHaveBeenCalled();
  });

  it("preserves the production API URLs", async () => {
    vi.stubGlobal("window", { location: { hostname: "admin.maestroswim.com" } });
    const { axiosConfig, axiosAccessMutationConfig } = await import("@/axios/config");
    expect(axiosConfig.defaults.baseURL).toBe("https://api.maestroswim.com");
    expect(axiosAccessMutationConfig.defaults.baseURL).toBe("https://api.maestroswim.com");
  });
});
