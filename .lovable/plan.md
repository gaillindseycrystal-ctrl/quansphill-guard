# Admin management and sign-in polish

## What will change

- Keep the shared header consistent everywhere, but show the project study footer only on the home page.
- Restyle the staff sign-in page to use the same typography, spacing, and card treatment as the live console.
- Add a protected **Admin** page to the staff area. The navigation link appears only for administrators.
- On that page, show current administrators by email, allow adding an existing staff account by email, and allow removing administrator access with a confirmation step.
- Show clear success, validation, account-not-found, permission, and last-admin protection messages.

## Security and data rules

- Continue storing grants only in the existing `user_roles` table.
- Add database policies so only administrators can list all admin role rows, insert admin grants, or remove admin grants.
- Prevent removal when it would leave zero administrators, including a sole administrator trying to remove themselves.
- Resolve entered emails on the server only; account email addresses and privileged credentials will never be exposed to ordinary staff or browser code.
- Re-check administrator status on every protected action. Hiding the Admin link is only a convenience, not the security boundary.

## Technical details

- Add authenticated server functions for checking admin access, listing admin emails, granting a role by existing-account email, and revoking a role.
- Use the signed-in user's database client for role writes so row-level security is applied; use privileged auth lookup only after administrator verification.
- Add an authenticated `/admin` route and invalidate its data after successful changes.
- Preserve the current protected-route gate and bearer-token middleware.
- Verify the sign-in page at mobile width, the administrator flow while signed in, denial for non-admin access, and the zero-admin safeguard.
