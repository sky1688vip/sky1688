# Internal Unit Ledger

**Implementation date:** 2026-08-26

## Scope

The platform now has an internal Unit ledger with two permitted directions:

| Direction | Authorized role | Rule |
|---|---|---|
| System → Agent | Administrator | An Administrator selects an active Agent and issues a positive Unit quantity. |
| Agent → Player | Active Agent | An Agent selects only an active Player provisioned by that same Agent and transfers a positive quantity no larger than the Agent's current available Units. |

The current implementation does **not** connect to a bank, payment processor, wallet, deposit, withdrawal, transfer network, or wagering settlement service. An Administrator issuance is an internal system allocation, not evidence of an external payment.

## Data integrity and authorization

`unit_balances` holds the current balance for each Agent or Player. `unit_transactions` is append-only and records the type, amount, origin, recipient, operator, note, and timestamp for every Unit change.

Agent-to-Player transfers perform a conditional debit inside a database transaction. If the Agent lacks sufficient Units, the debit, Player credit, and audit record are all rejected together. Transfers cannot target a Player owned by a different Agent, an invited Player, or a suspended Player.

## Interfaces

Administrators use the Agent management page to issue Units and read the latest ledger rows. Agents use **Unit ဖြည့်ရန်** in the Agent sidebar to inspect their available Units, select an active Player, transfer Units, and review their own incoming and outgoing Unit history.

## Validation evidence

Migration `0007_striped_grey_gargoyle.sql` was generated, reviewed, and applied. The live database contains `unit_balances` and `unit_transactions`. The authorization and input contracts cover positive bounded amounts, Admin-only issuance, Agent-only transfer, and insufficient-balance errors. The complete TypeScript check, Vitest suite, and production build passed with **27 tests**.
