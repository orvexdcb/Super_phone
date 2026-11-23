# SUPER PHONE — Carrier Billing Integration Plan

## Product decision

SUPER PHONE should let a signed-in user pay for a listing promotion or other paid feature using a mobile line that may be different from the phone number on the user's profile. The payment-line number is transaction data and must never overwrite `profiles.phone`.

Supported operator choices in the product:
- Zain Iraq
- Asiacell
- Korek

Web and Android should use the same server-side payment contract.

## Verified provider position (research checked 2026-11-23)

| Operator | Publicly documented route | Current integration status |
| --- | --- | --- |
| Asiacell | Ooredoo Iraq Developer Portal lists DCB One-Time and DCB Recurring as live APIs. Access requires developer registration, app creation, and approval. | Candidate direct integration; merchant access and credentials not yet available. |
| Zain Iraq | Zain announced Carrier Billing with SLA Digital; Zain Group also documents Dizlee as its DCB platform. | Candidate via Zain/Dizlee or SLA Digital; merchant onboarding and credentials required. |
| Korek | MT2 publicly lists Korek among Iraq operators it supports for DCB. | Unverified for current production merchant onboarding; written confirmation required. |

Do not represent all three as active payment rails until each provider has confirmed merchant eligibility, settlement, fees, refund/reversal support, prepaid/postpaid eligibility, and production access in writing.

## Architecture

1. Web and mobile create a payment intent through a trusted server endpoint.
2. The server authenticates the user, validates the product/fee from server-controlled configuration, normalizes the payment-line number, and creates an idempotent pending transaction.
3. The server selects an operator adapter. Provider credentials remain server-side only.
4. The customer completes the operator's consent/OTP/checkout flow.
5. A signed provider callback is verified server-side. The server also performs a provider status inquiry where supported; browser redirects are never proof of payment.
6. Only a confirmed successful transaction can fulfil the paid feature. Repeated callbacks must be idempotent.
7. Store provider transaction identifiers, operator, payment-line number, amount, currency, state, timestamps, and sanitized failure reason for reconciliation.

## Required transaction states

`created`, `pending`, `succeeded`, `failed`, `cancelled`, `reversed`, `expired`.

Never store OTPs, PINs, SIM secrets, or provider credentials in the database. Do not log full credentials or authentication payloads.

## Database implementation notes

The current SUPER PHONE Supabase project is `Super_phone` (`eqlenftagozvjezswbaf`). Its public schema currently contains profiles, listings, accessory tables, favorites, reports, and related tables; no payment transaction table exists.

A future migration should add a dedicated payment transaction table with:
- UUID primary key and user foreign key
- purpose and optional listing/feature reference
- operator enum/text constrained to `zain`, `asiacell`, `korek`
- payment-line phone number separate from profile phone
- amount in IQD, currency, unique idempotency key
- provider name and unique provider transaction reference
- constrained status and timestamps
- RLS: users may read only their own transactions; clients must not be allowed to set `succeeded` or fulfil paid features directly

Do not create this table or deploy a migration until the schema and RLS policy have been reviewed and approved. Do not modify the existing listings publish flow until a real provider flow is available and tested.

## Onboarding checklist

- [ ] Asiacell/Ooredoo: register a developer account, request DCB One-Time access, obtain sandbox credentials and merchant approval.
- [ ] Zain Iraq: contact Zain/Dizlee or SLA Digital for Iraq DCB merchant onboarding, sandbox and production access.
- [ ] Korek: obtain written confirmation of current DCB merchant coverage, API docs, sandbox, fees and settlement.
- [ ] Confirm permitted digital goods/use case (listing fees/promotions), price limits, consent requirements and refund rules with each operator.
- [ ] Obtain signed webhook/callback specification and test credentials.
- [ ] Run sandbox tests for success, decline, timeout, duplicate callback, cancellation, refund/reversal and mismatched phone number.
- [ ] Only then enable each operator independently in production.

## Source references

- Ooredoo Iraq Developer Portal: https://developer.ooredoo.com/iraq-developer-portal
- Ooredoo Direct Carrier Billing API: https://developer.ooredoo.com/use-cases/carrier-billing
- Zain Iraq Carrier Billing announcement: https://www.iq.zain.com/en/zain-iraq-launches-carrier-billing-with-sla-digital
- Zain/Dizlee DCB overview: https://www.dizlee.com/blog/press-releases-2/direct-carrier-billing-1
- MT2 Pay (operator list includes Asiacell, Korek, Zain Iraq): https://www.mt2morrow.com/mt2-pay.html
