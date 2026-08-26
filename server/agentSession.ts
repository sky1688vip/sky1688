import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { ENV } from "./_core/env";

export const AGENT_SESSION_COOKIE = "sky1688_agent_session";
const AGENT_SESSION_AUDIENCE = "sky1688-agent";
const AGENT_SESSION_DURATION_SECONDS = 12 * 60 * 60;

function sessionKey() {
  if (!ENV.cookieSecret) throw new Error("AGENT_SESSION_SECRET_UNAVAILABLE");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createAgentSession(userId: number) {
  return new SignJWT({ userId, kind: "agent" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(AGENT_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${AGENT_SESSION_DURATION_SECONDS}s`)
    .sign(sessionKey());
}

export async function getAgentSessionUserId(req: Request) {
  const token = parseCookieHeader(req.headers.cookie ?? "")[AGENT_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
      audience: AGENT_SESSION_AUDIENCE,
    });
    return typeof payload.userId === "number" && Number.isInteger(payload.userId) && payload.userId > 0
      ? payload.userId
      : null;
  } catch {
    return null;
  }
}
