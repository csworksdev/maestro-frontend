import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_COOKIE_KEYS,
  AUTH_STORAGE_KEY,
  clearAllCookies,
  clearAuthCookies,
  getAuthCookies,
  setAuthCookies,
} from "./authCookies";

const expireCookie = (name) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

describe("authCookies", () => {
  beforeEach(() => {
    clearAllCookies();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("keeps auth readable from storage when cookies are unavailable", () => {
    setAuthCookies({
      access: "access-token",
      refresh: "refresh-token",
      data: { user_id: "42", roles: "Admin" },
    });

    Object.values(AUTH_COOKIE_KEYS).forEach(expireCookie);

    expect(getAuthCookies()).toEqual({
      access: "access-token",
      refresh: "refresh-token",
      data: { user_id: "42", roles: "Admin" },
    });
  });

  it("uses sessionStorage for non-persistent auth sessions", () => {
    setAuthCookies(
      {
        access: "session-access",
        refresh: "session-refresh",
        data: { user_id: "7", roles: "Coach" },
      },
      { days: null },
    );

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(JSON.parse(window.sessionStorage.getItem(AUTH_STORAGE_KEY))).toEqual({
      access: "session-access",
      refresh: "session-refresh",
      data: { user_id: "7", roles: "Coach" },
    });
  });

  it("clears mirrored auth storage on logout", () => {
    setAuthCookies({
      access: "access-token",
      refresh: "refresh-token",
      data: { user_id: "42", roles: "Admin" },
    });

    clearAuthCookies();

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(getAuthCookies()).toEqual({ access: "", refresh: "", data: null });
  });
});
