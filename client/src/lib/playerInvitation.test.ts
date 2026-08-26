import { describe, expect, it } from "vitest";
import { getPlayerInvitationUrl } from "./playerInvitation";

describe("Player invitation link helper", () => {
  it("keeps a production invitation link shareable from localhost", () => {
    const url = getPlayerInvitationUrl("http://localhost:3000", "player-invite-token-example-1234567890");
    expect(url).toBe("https://sky1688lotto-csfu4zpn.manus.space/player/activate?invite=player-invite-token-example-1234567890");
  });

  it("encodes the invitation token as a query parameter", () => {
    const url = new URL(getPlayerInvitationUrl("https://sky1688lotto-csfu4zpn.manus.space", "a+b/c?d"));
    expect(url.pathname).toBe("/player/activate");
    expect(url.searchParams.get("invite")).toBe("a+b/c?d");
  });
});
