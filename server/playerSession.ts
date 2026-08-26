import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { ENV } from "./_core/env";

export const PLAYER_SESSION_COOKIE = "sky1688_player_session";
const PLAYER_SESSION_AUDIENCE = "sky1688-player";
const PLAYER_SESSION_DURATION_SECONDS = 12 * 60 * 60;

function sessionKey() {
  if (!ENV.cookieSecret) throw new Error("PLAYER_SESSION_SECRET_UNAVAILABLE");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createPlayerSession(playerProfileId: number) {
  return new SignJWT({ playerProfileId, kind: "player" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(PLAYER_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PLAYER_SESSION_DURATION_SECONDS}s`)
    .sign(sessionKey());
}

export async function getPlayerSessionProfileId(req: Request) {
  const token = parseCookieHeader(req.headers.cookie ?? "")[PLAYER_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
      audience: PLAYER_SESSION_AUDIENCE,
    });
    return typeof payload.playerProfileId === "number" && Number.isInteger(payload.playerProfileId) && payload.playerProfileId > 0
      ? payload.playerProfileId
      : null;
  } catch {
    return null;
  }
}
