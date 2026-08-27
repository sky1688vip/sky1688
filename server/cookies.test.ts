import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

describe("getSessionCookieOptions", () => {
  it("uses a Secure SameSite=None cookie for HTTPS requests", () => {
    const options = getSessionCookieOptions({ protocol: "https", headers: {} } as never);
    expect(options).toMatchObject({ httpOnly: true, path: "/", secure: true, sameSite: "none" });
  });

  it("does not issue a browser-invalid SameSite=None cookie over an untrusted HTTP request", () => {
    const options = getSessionCookieOptions({ protocol: "http", headers: {} } as never);
    expect(options).toMatchObject({ httpOnly: true, path: "/", secure: false, sameSite: "lax" });
  });
});
