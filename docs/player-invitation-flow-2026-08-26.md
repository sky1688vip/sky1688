# Agent-Issued Player Credential Flow

**Implementation date:** 2026-08-26

## Purpose

Player accounts are now controlled by active Agents. An Agent creates all three items a Player needs: a one-time invitation link, a Player ID, and an initial password. The Player opens the Agent-provided link and enters the issued Player ID and password. **No Manus account or Manus login is required for the Player.**

The Player profile continues to carry the issuing Agent's internal ID. The implementation contains no wallet, payment, transfer, or wagering functions.

## Lifecycle

| Step | Control |
|---|---|
| Agent creates Player access | Only an authenticated, active Agent can create the invitation, Player ID, and initial password. |
| Credential storage | The initial password is stored only as an scrypt hash plus salt. The raw password is returned once to the issuing Agent's current browser session. |
| Link storage | The service generates a 32-byte URL-safe link secret and stores only its SHA-256 hash. |
| Link sharing | The issuing Agent can copy the raw link and Player credentials only in the current Agent console session, then shares them securely with the Player. |
| Activation | The Player opens the link, enters the issued Player ID and initial password, and receives a dedicated Player session. |
| Password replacement | A first-time Player session requires the Player to replace the Agent-provided initial password with a private password. |
| Ongoing sign-in | The Player later signs in at `/player` with the Player ID and private password. |
| Validity | The invitation and initial password expire after 72 hours. The link can be redeemed once. |
| Attribution | The Player profile and invitation preserve the issuing Agent's internal ID and the linked Player profile ID. |
| Revocation | The issuing Agent can revoke an unused invitation. Its linked unactivated Player credential is suspended. |

## Enforcement

The server requires the invitation token, the matching Player ID, and the correct password for `accounts.player.activate`. It rejects missing, expired, revoked, reused, unavailable-Agent, mismatched, or locked credentials. Player credentials use five-attempt, fifteen-minute lock behavior and a separate signed, HTTP-only Player session cookie. Player session procedures cannot satisfy Agent or Administrator authorization rules.

The `/player/activate` page blocks activation without an Agent link. The `/player` page permits Player credential sign-in only; it has no direct account-creation action.

## Validation evidence

Migration `0005_watery_iron_patriot.sql` was generated, reviewed, and applied successfully. The updated TypeScript check, full Vitest suite, and production build passed with **19 tests**. Browser checks confirmed that direct `/player/activate` shows the Agent-link-required state and that `/player` presents Player ID/password sign-in without self-registration.
