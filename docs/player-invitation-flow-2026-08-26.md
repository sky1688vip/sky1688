# Agent-Issued Player Invitation Flow

**Implementation date:** 2026-08-26

## Purpose

Player onboarding now requires an invitation link created by an active Agent. The public Player pages no longer allow a plain user to create a profile directly. This keeps Agent attribution with each Player profile while retaining the existing Manus-authenticated identity for the Player.

## Lifecycle

| Step | Control |
|---|---|
| Agent generates link | Only an authenticated, active Agent can call the invitation-create operation. |
| Link storage | The service generates a 32-byte URL-safe secret and stores only its SHA-256 hash. |
| Link sharing | The full Player URL is displayed only in the issuing Agent's current browser session. |
| Validity | Each link expires after 72 hours and can be used once. |
| Player redemption | A plain Manus user opens the link, signs in, and redeems the token to create a Player profile. |
| Attribution | The created Player profile stores the issuing Agent's internal ID. |
| Revocation | The issuing Agent can revoke an unused link from the Agent console. |

## Enforcement

The server requires the invitation token for `accounts.player.activate`. It rejects missing, expired, revoked, already-redeemed, or unavailable-Agent invitations. Agent and administrator identities remain blocked from Player creation. The invitation update and Player profile creation execute in one database transaction.

The `/player/activate` page shows an invitation-required state when no token is present, and `/player` instructs a plain user without a profile to obtain an Agent link instead of showing a direct activation action.

## Validation evidence

The migration created `player_invitations` and added `player_profiles.agentId` successfully. The automated validation completed with 18 passing tests, a successful TypeScript check, and a successful production build. The public Player activation page was also visually checked without a token and displayed the Agent-link-required state.
