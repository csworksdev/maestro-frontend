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

  it("uses runtime Firebase config when build env is missing", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "");
    vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "");
    vi.stubEnv("VITE_FIREBASE_STORAGE_BUCKET", "");
    vi.stubEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "");
    vi.stubEnv("VITE_FIREBASE_APP_ID", "");

    window.__FIREBASE_CONFIG__ = {
      apiKey: "runtime-api-key",
      authDomain: "runtime.firebaseapp.com",
      projectId: "runtime-project",
      storageBucket: "runtime.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abc",
    };

    const { getMessagingInstance } = await import("@/firebase/firebase");

    await expect(getMessagingInstance()).resolves.toEqual({
      name: "messaging",
    });
    expect(initializeAppMock).toHaveBeenCalledWith(window.__FIREBASE_CONFIG__);
    expect(getMessagingMock).toHaveBeenCalled();
    expect(isSupportedMock).toHaveBeenCalled();
  });
});
