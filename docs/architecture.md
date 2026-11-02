# Gymverse architecture

## Tenancy

Every gym-scoped row carries `gymId`. Authorization resolves the caller's staff assignment from the JWT subject — **never** from a client-supplied gym identity alone. Super admins bypass gym checks for platform operations only.

## Auth

- Registration/login issue a JWT (`Authorization: Bearer` + `gymverse_token` httpOnly cookie).
- Global `JwtAuthGuard` with `@Public()` opt-out.
- `RolesGuard` enforces platform role (`SUPER_ADMIN`) or gym staff roles (`OWNER`, `MANAGER`, `RECEPTIONIST`, `TRAINER`).

## Modules (API)

Auth, Users, Gyms, Members, Plans, Memberships, Attendance, Payments, Notifications, Reports, Staff, Admin, Audit.

## Attendance

Staff enters Member ID → lookup scoped to staff gym → active membership required → check-in stamped with gym-local date → unique `(gymId, gymMemberId, localDate)` prevents duplicates unless owner/manager override with audited reason.

## Payments

Manual ledger only. Recording a payment can increase `membership.amountPaid`. Corrections create a linked correction row and cancel the original (audit trail).

## Notifications

`@nestjs/schedule` cron (default every 15 minutes) expires due memberships and enqueue/dedupe email+in-app reminders (7/3/1/0/-1 day offsets) via `dedupeKey`.

## Frontend route groups

- Public: `/`, `/gyms`, `/gyms/[slug]`
- Auth: `/login`, `/register`
- Member: `/member/*`
- Owner/staff: `/owner`, `/owner/[gymId]/*`
- Super admin: `/admin/*`
