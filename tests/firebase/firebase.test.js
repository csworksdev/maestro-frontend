import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const initializeAppMock = vi.fn(() => ({ name: "test-app" }));
const getMessagingMock = vi.fn(() => ({ name: "messaging" }));
const isSupportedMock = vi.fn(() => Promise.resolve(true));

describe("firebase messaging initialization", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.clearAllMocks();

    vi.doMock("firebase/app", () => ({
      initializeApp: initializeAppMock,
    }));

    vi.doMock("firebase/messaging", () => ({
      getMessaging: getMessagingMock,
      getToken: vi.fn(),
      onMessage: vi.fn(),
      isSupported: isSupportedMock,
    }));
  });

  afterEach(() => {
    vi.doUnmock("firebase/app");
    vi.doUnmock("firebase/messaging");
    vi.unstubAllEnvs();
  });

  it("does not initialize messaging when Firebase config is incomplete", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "");
    vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "");
    vi.stubEnv("VITE_FIREBASE_STORAGE_BUCKET", "");
    vi.stubEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "");
    vi.stubEnv("VITE_FIREBASE_APP_ID", "");

    const { getMessagingInstance } = await import("@/firebase/firebase");

    await expect(getMessagingInstance()).resolves.toBeNull();
    expect(initializeAppMock).not.toHaveBeenCalled();
    expect(getMessagingMock).not.toHaveBeenCalled();
    expect(isSupportedMock).not.toHaveBeenCalled();
  });
});
