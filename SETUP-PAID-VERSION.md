# Mission150 paid version setup

This build adds:
- Email/password signup + login
- Paid-access lock
- One-time ₹99 Razorpay checkout
- Server-side Razorpay signature verification
- Supabase profile record for paid status

## 1. Supabase
Create a Supabase project and run `supabase.sql` in SQL Editor.
Copy the project URL and anon/public key into `membership.js`:
- SUPABASE_URL
- SUPABASE_ANON_KEY

If email confirmation is enabled, users must verify their email before login.

## 2. Razorpay
Create a Razorpay account and obtain the Key ID/Key Secret. Put the **Key ID only** in `membership.js`.
Never put the Key Secret in browser code.

Set these Vercel environment variables:
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

The service role key must stay server-side in Vercel environment variables.

## 3. Install server dependency
Run `npm install` before deploying if your Vercel setup requires a lockfile.

## 4. Frontend config
Edit `membership.js` and replace the three YOUR_ placeholders.

## 5. Deploy
Deploy this folder to Vercel. Vercel will expose:
- `/api/create-order`
- `/api/verify-payment`

## Important security note
The ₹99 payment is verified on the server using Razorpay's signature. Do not replace that with a browser-only `localStorage` paid flag.

The existing tracker still stores its study data in browser localStorage. For true cross-device user accounts, the tracker data should next be migrated to a user-scoped Supabase table.
