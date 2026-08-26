# SKY1688 Account Flow Review

**Review date:** 2026-08-26  
**Scope:** Agent invitation/activation and Player onboarding code, authorization, persistence, UI behavior, and existing tests.  
**Out of scope:** Wallets, payments, transfers, wagering, KYC/AML workflows, and financial operations. None of those modules are present in the reviewed flow.

## Review result

The two flows are structurally separated and the core authorization model is implemented correctly for normal activation and onboarding. In particular, an Agent cannot self-register: an administrator creates the invitation, the server hashes the activation code, and activation requires an authenticated plain-user account whose Manus email matches the invitation. Player onboarding is deliberately separate and limited to plain-user accounts.

However, **Agent suspension is not a true access revocation** in the current implementation. Suspending the Agent record does not remove the linked user's `agent` role, and Agent-only reads do not require `agents.status === "active"`. This should be corrected before any privileged operational Agent functions are added.

## Entry points and intended behavior

| Flow | Route | Server operation | Intended outcome |
|---|---|---|---|
| Admin Agent provisioning | `/admin/agents` | `adminAgents.create` | Admin creates an invited Agent and receives a one-time activation code in the current page state. |
| Agent activation | `/agent/activate` | `accounts.agent.activate` | A signed-in plain user with the invitation's exact email consumes a valid code and becomes an Agent. |
| Agent console | `/agent` | `accounts.agent.me` | An Agent reads the linked Agent record and sees the limited current console. |
| Player onboarding | `/player/activate` | `accounts.player.activate` | A signed-in plain user creates a Player profile. |
| Player account | `/player` | `accounts.player.me` | A Player profile holder sees profile status and public-content links. |

The route map is explicit in `client/src/App.tsx` and keeps the activation pages outside the admin console.

## Agent activation review

### Controls that are working as designed

The `adminAgents` router uses `adminProcedure` for listing, invitation creation, and suspension. Agent invitation input is validated with a 2–160 character name, a valid normalized email, and an optional phone number capped at 40 characters in `server/accountSchemas.ts`.

On creation, `server/db.ts` generates a `SKY-` activation code, stores only its SHA-256 hash, marks the record as `invited`, sets a 72-hour expiration, and records the creating administrator. The database schema makes the Agent email, Agent code, linked user, and activation-code hash unique. The administrator UI keeps the newly issued activation code only in React state and states that it is displayed in the current administrator session; it does not display the hash in the list.

Activation is restricted to a logged-in account with role `user`. `assertAgentActivationAllowed` rejects a missing code, a non-invited record, an expired record, and an email mismatch after lowercasing and trimming both addresses. The successful update runs in a database transaction: it links the Agent to the Manus user, marks the Agent active, records `activatedAt`, and promotes the linked user record to role `agent`. The `invited` status guard makes an already-active code unusable through the normal path.

The activation UI provides distinct states for unauthenticated, plain-user, Agent, and admin sessions, displays mutation errors, disables its button while submitting, and redirects a successful activation to `/agent`.

### Findings requiring remediation

| Priority | Finding | Evidence | Impact | Recommended remediation |
|---|---|---|---|---|
| **High** | Suspension does not revoke the user's `agent` role. | `suspendAgent` only sets `agents.status = "suspended"`; `accounts.agent.me` only checks `ctx.user.role === "agent"`. | A suspended identity still passes Agent-role guards and can reach the Agent console. Future Agent-only procedures would be exposed unless each one separately checks status. | Introduce an Agent-active procedure/guard that loads the linked record and requires `status === "active"`. On suspension, also demote the linked user role or enforce the status guard on every Agent capability. Add a suspension test. |
| **High** | Agent activation uses a 5-byte (40-bit) code and has no attempt throttling. | `randomCode("SKY", 5)` creates 10 hexadecimal characters; no rate-limit or failed-attempt field exists. | Online code guessing is unnecessarily easier than a standard opaque invitation token, especially while a 72-hour invitation is valid. | Use at least 16 random bytes (128 bits), add per-code/account/IP attempt controls and temporary lockout or expiry on repeated failures. |
| **Medium** | Activation update is not conditionally locked to the invited state. | The record is selected first and then updated by `id` inside the transaction, without `status = invited` in the update predicate. | Concurrent requests could promote more than one user record or overwrite the linked `userId` in an abnormal same-email/concurrent scenario. | Perform a conditional update (`id`, `status = invited`, and unlinked user) and require exactly one affected row before promoting the user. |
| **Low** | The post-activation Agent UI points an already-active Agent to `/admin`. | `AgentActivation.tsx` renders `href="/admin"` for `user.role === "agent"`. | The Agent is sent to an administrator-only page and receives a denial rather than returning to the Agent console. | Change that link to `/agent`. |
| **Low** | There is no resend/revoke/reactivate lifecycle. | The admin UI can create and suspend; suspended entries explicitly cannot be restored from the UI. | Administrators need a manual new invitation or direct data work for common operations. | Define an explicit policy for reissue, revoke, and restore. Record these events with actor and timestamp. |

## Player onboarding review

### Controls that are working as designed

Player operations use the same authenticated-session requirement but only permit role `user`. Agent and admin accounts are rejected at both the UI and server router layers, which intentionally preserves the project's one-role-at-a-time separation.

The onboarding page is explicit: a plain user must press the create/activate action, after which the server creates a `player_profiles` row with a unique `userId`, optional display name sourced from the user name, and `active` status. Repeating the request after a profile exists normally returns the existing profile, so the intended operation is idempotent. The Player account page directs a signed-in user with no profile to `/player/activate` and shows only public results and Dream1000 links after onboarding.

The schema stores no wallet, payment, transfer, balance, wager, or financial data. The reviewed UI also explicitly states that those modules are absent.

### Findings requiring remediation

| Priority | Finding | Evidence | Impact | Recommended remediation |
|---|---|---|---|---|
| **Medium** | `player_profiles.status` is currently informational rather than enforced. | The schema allows `active` and `suspended`, but `accounts.player.me` returns any profile and the UI presents it as active. | A future suspended Player would still load as an enabled account. | Require `status === "active"` for Player account access; add an administrator suspension/reinstatement policy if the status column is retained. |
| **Medium** | The create-or-return logic can race. | It selects for an existing profile, then inserts; the unique index will reject a simultaneous second insert. | Rapid concurrent activation requests could surface a unique-constraint error instead of returning a successful existing profile. | Use an upsert or catch the duplicate-key result and re-read the profile before returning. |
| **Low** | Player display name is not an onboarding choice. | The server uses `ctx.user.name` when creating the record; no profile form exists. | This is suitable for a minimal identity profile but not for a customizable Player account. | Add a validated profile-edit route only if a business requirement exists; do not collect unnecessary personal data. |

## Test and type-check evidence

The focused validation completed successfully on 2026-08-26:

| Check | Result | Coverage evidence |
|---|---|---|
| `pnpm test -- --run server/accounts.test.ts` | Passed | 3 test files, 13 tests passed. Account tests cover invitation input normalization, non-admin rejection, invalid/expired/email-mismatched activation, plain-user activation, admin rejection, Player profile creation, and Agent rejection from Player endpoints. |
| `pnpm check` | Passed | TypeScript completed with no errors. |

The current test suite is primarily contract-level with mocked persistence. It does **not** cover conditional database updates, concurrent activation, Agent suspension revocation, Player suspension behavior, reused-code attempts against the persistence layer, or the incorrect Agent-page redirect. These should be added alongside the recommended fixes.

## Recommended remediation order

1. Make Agent suspension a true server-side revocation and test it. Do not rely on a front-end status label.
2. Enforce Player `active` status or remove the unused suspended state until a full account-management policy exists.
3. Increase activation-token entropy and add rate limiting/failed-attempt controls.
4. Make Agent activation and Player profile creation concurrency-safe at the database-operation level.
5. Correct the Agent page's active-account link from `/admin` to `/agent`, then add UX tests for the redirected states.

## Overall assessment

The implementation meets the intended **admin-provisioned Agent / explicit Player onboarding foundation**. It is suitable for the current non-financial content platform after the suspension/revocation weakness is addressed. Before adding any sensitive Agent privileges, money movement, account recovery, or regulated activity, the remediation items above and appropriate compliance controls should be implemented and independently tested.
