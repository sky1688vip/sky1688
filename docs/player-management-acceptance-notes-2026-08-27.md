# Player Management Acceptance Notes

## Live interface observations

The Agent console was opened with a valid Agent credential session after the Player-management deployment. The published **User List** displayed only that Agent's issued Player accounts, together with a Unit balance column, account status, expiry, and permitted actions. The list did not display existing passwords or bank account numbers.

The verified records shown in the interface were not active Players, so status change, password reset, and Unit adjustment actions were correctly unavailable. Issued invitations retained their revoke action.

## Agent-to-Administrator session return

After the published bundle propagated, the Agent Dashboard displayed **Admin သို့ပြန်ရန်** alongside the Agent logout control. The control clears only the Agent credential cookie and redirects to `/admin/agents`.

The return control was accepted through the browser. The Agent credential session closed and the Administrator Agent management page became accessible again after the authorized Administrator Manus session was present. This also confirmed that an Agent can sign in with Agent ID/password while an Administrator Manus session exists, then safely return to Admin management without a full Agent logout.

## Player mobile experience update

The Player entry screen was rebuilt as a mobile-first login interface informed by the supplied references. It keeps the Agent-issued Player ID/password flow, offers optional local Player-ID-only remembering, and uses a full page reload after a successful credential login so the newly issued httpOnly Player session cookie is read by the next request context.

Authenticated Player screens now include a mobile home, Profile view, and read-only internal Unit balance/history view. Player session responses were minimized to identity and account-status fields; password hashes, lockout metadata, and encrypted bank-account material are not included. The Player Unit view exposes no cash-in/out, payment, wallet, withdrawal, or wagering operation.

During live login validation, an existing Agent credential cookie in the same browser was found to take precedence over a newly created Player session. The request context now resolves an active Player session before an Agent session. This lets a Player sign in and reach Player Home even when the browser has previously been used for Agent management; the Agent credential remains available again after the Player session is cleared.
