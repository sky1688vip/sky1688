# Agent Player Creation Form and Bank-Profile Handling

**Implementation date:** 2026-08-26

## Purpose

An active Agent now creates each Player account through the Agent Dashboard's **Create user** form. The form accepts a Player ID without spaces, an initial password, a phone number, bank account name, bank type, streamer-account selection, and a bank account number. It then issues the existing one-time Player invitation link.

## Security and access boundaries

| Data element | Handling |
|---|---|
| Player ID and initial password | Validated server-side. The password is stored only as an scrypt hash plus salt, and its raw value is visible only in the issuing Agent's current session. |
| Invitation link | Generated as a 32-byte URL-safe secret. Only its SHA-256 hash is stored; the raw link is visible only in the issuing Agent's current session. |
| Phone, account name, bank type, streamer account | Stored on the Agent-issued Player profile and returned only to the issuing Agent's invitation list. |
| Bank account number | Encrypted at rest with AES-256-GCM derived from the server cookie secret. Its encrypted value and IV are never returned through the Agent invitation list or Player session profile. |
| Agent access | Creation and list procedures require an authenticated active Agent. A different Agent cannot list or revoke another Agent's Player invitations. |

## Current scope

The form creates a Player credential record and invitation only. It does not create a wallet, bank connection, deposit, withdrawal, transfer, payment, or wagering transaction. Existing Players continue to activate using the issued link and first-time credentials, then must replace the initial password.

## Validation evidence

Migration `0006_quick_marauders.sql` was generated, reviewed, and applied successfully. The live schema contains all six new Player profile columns. Type checking, the full Vitest suite, and production build passed with **23 tests**.
