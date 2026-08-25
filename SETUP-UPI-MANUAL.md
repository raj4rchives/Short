# Mission150 — ₹99 UPI Manual Approval

1. In `membership.js`, replace `YOUR_UPI_ID@upi` with your real UPI ID.
2. Run `supabase.sql` in Supabase SQL Editor. This version is safe to run repeatedly.
3. User signs up/logs in, pays exactly ₹99 by UPI, enters UTR, and submits it.
4. You verify the payment in your UPI/bank app.
5. In Supabase → Table Editor → `payment_requests`, find the request and its `user_id`. Then run:

```sql
update public.profiles set is_paid=true, paid_at=now() where id='USER_UUID';
update public.payment_requests set status='approved', reviewed_at=now() where id=REQUEST_ID;
```

6. User taps **Refresh Approval Status** or logs in again; the tracker unlocks.

Users cannot mark themselves as paid because there is no client update policy on `profiles`. Never put a Supabase service-role key in frontend code.
