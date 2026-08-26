import { describe, expect, it } from "vitest";
import { agentActivationPath, defaultPublicAppOrigin, getAgentActivationUrl } from "./agentActivation";

describe("Agent activation link", () => {
  it("uses the fixed public activation path", () => {
    expect(agentActivationPath).toBe("/agent/activate");
  });

  it("creates a shareable activation URL from the current site origin", () => {
    expect(getAgentActivationUrl("https://sky1688lotto-csfu4zpn.manus.space")).toBe(
      "https://sky1688lotto-csfu4zpn.manus.space/agent/activate",
    );
  });

  it("uses the live public site rather than a localhost preview URL", () => {
    expect(getAgentActivationUrl("http://127.0.0.1:3000")).toBe(`${defaultPublicAppOrigin}/agent/activate`);
  });
});
