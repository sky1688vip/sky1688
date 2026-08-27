# Player Management Acceptance Notes

## Live interface observations

The Agent console was opened with a valid Agent credential session after the Player-management deployment. The published **User List** displayed only that Agent's issued Player accounts, together with a Unit balance column, account status, expiry, and permitted actions. The list did not display existing passwords or bank account numbers.

For the user-authorized controlled account, the live User List displayed active-account controls for suspend/reactivate, one-time password reset, and an internal Unit adjustment form. The form requires an operation choice, positive amount, and reason before confirmation. The form was inspected without submitting an internal Unit balance change.

The active controlled account was suspended and immediately reactivated as a reversible acceptance test. Its final status was active and its displayed Unit balance did not change. The account-event log recorded the suspend, reactivate, and password-reset events without storing or exposing raw credentials.

## Agent-to-Administrator session return

After the published bundle propagated, the Agent Dashboard displayed **Admin သို့ပြန်ရန်** alongside the Agent logout control. The control clears only the Agent credential cookie and redirects to `/admin/agents`.

The return control was accepted through the browser. The Agent credential session closed and the Administrator Agent management page became accessible again after the authorized Administrator Manus session was present. This also confirmed that an Agent can sign in with Agent ID/password while an Administrator Manus session exists, then safely return to Admin management without a full Agent logout.

## Player mobile experience update

The Player entry screen was rebuilt as a mobile-first login interface informed by the supplied references. It keeps the Agent-issued Player ID/password flow, offers optional local Player-ID-only remembering, and uses a full page reload after a successful credential login so the newly issued httpOnly Player session cookie is read by the next request context.

Authenticated Player screens now include a mobile home, Profile view, and read-only internal Unit balance/history view. Player session responses were minimized to identity and account-status fields; password hashes, lockout metadata, and encrypted bank-account material are not included. The Player Unit view exposes no cash-in/out, payment, wallet, withdrawal, or wagering operation.

During live login validation, an existing Agent credential cookie in the same browser was found to take precedence over a newly created Player session. The request context now resolves an active Player session before an Agent session. This lets a Player sign in and reach Player Home even when the browser has previously been used for Agent management; the Agent credential remains available again after the Player session is cleared.

The authenticated Player Home was then verified live. It presents the reference-inspired mobile hierarchy: result banner, service shortcut row, 2D/3D/Dream/Unit shortcuts, notification card, and Player bottom navigation. The Player-specific header no longer includes public navigation or an administrator entry, and its brand mark does not navigate to the public home page.

## Credential recovery

The controlled Player account was temporarily locked after rejected credential attempts. An Agent-mediated password reset cleared the lock and required the next password change. A temporary credential shown in a user-provided screenshot was rotated rather than reused. The final account state was active, unlocked, and configured with a private password; no credential value is recorded in this note.
