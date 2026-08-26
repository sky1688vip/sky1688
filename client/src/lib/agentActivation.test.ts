import { describe, expect, it } from "vitest";
import { agentActivationPath, defaultPublicAppOrigin, getAgentActivationUrl } from "./agentActivation";

describe("Agent credential login link", () => {
  it("uses the fixed public Agent credential login path", () => {
    expect(agentActivationPath).toBe("/agent/login");
  });

  it("creates a shareable login URL from the current site origin", () => {
    expect(getAgentActivationUrl("https://sky1688lotto-csfu4zpn.manus.space")).toBe(
      "https://sky1688lotto-csfu4zpn.manus.space/agent/login",
    );
  });

  it("uses the live public site rather than a localhost preview URL", () => {
    expect(getAgentActivationUrl("http://127.0.0.1:3000")).toBe(`${defaultPublicAppOrigin}/agent/login`);
  });
});
