# Timber Stock

A dead-simple QR stock app. Scan a product's QR code on your phone, open its page,
and tap **Add 1** or **Take away 1**. That's it.

- **Next.js** (App Router)
- **Supabase** (Postgres)
- **Vercel** (deploy)
- Mobile-first, plain, big buttons.

## How it works

| Page | What it's for |
| --- | --- |
| `/item/[slug]` | The scan page. Shows the product + huge quantity and two big buttons. |
| `/admin/items` | Editable product table: add, edit, archive, view/print QR codes. |
| `/admin/qr-print` | Printable QR labels (all products, or one via `?slug=`). |

All writes (add / edit / archive / +1 / −1) go through server API routes that check a
shared **admin PIN**. The PIN is entered **once per device**, saved in `localStorage`,
and sent with every action. The database is never touched directly from the browser —
the server uses the Supabase service-role key, and the tables have RLS enabled with no
public policies.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`supabase/migration.sql`](supabase/migration.sql),
   and run it. This creates the two tables, the `updated_at` trigger, locks the tables
   with RLS, and inserts ~10 starter timber products.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** secret → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Run locally

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INVENTORY_ADMIN_PIN=1234
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Open <http://localhost:3000/admin/items>. The first action will prompt for the PIN.

## 3. Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New → Project** and import the repo.
3. Under **Environment Variables**, add the same four keys:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service-role secret |
   | `INVENTORY_ADMIN_PIN` | the PIN staff will type |
   | `NEXT_PUBLIC_SITE_URL` | your production URL, e.g. `https://your-app.vercel.app` |

4. Deploy.
5. **Important:** set `NEXT_PUBLIC_SITE_URL` to the real deployed URL so the generated
   QR codes point at the live site, then redeploy. (If you skip it, QR codes fall back
   to whatever origin the browser is on when they're generated.)

## 4. Print the labels

Go to `/admin/qr-print`, press **Print all labels**, and cut along the dashed lines.
Each label has the name, size, QR code, and current quantity on a clean white card.

## Security notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only (it is never imported into a client
  component here).
- Change `INVENTORY_ADMIN_PIN` from the default before going live.
- Anyone with the PIN can adjust stock — that's the intended simplicity. If a phone is
  lost, change the PIN in Vercel and redeploy; every device will be prompted again.
