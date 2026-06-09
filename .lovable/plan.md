
# Nieve Blyth Photography — Build Plan

A premium, light-themed, Scandinavian-minimalist portfolio site with a private admin area for managing photos and content, and booking enquiries delivered to **nieve_blyth@icloud.com**.

## Design Language

- **Palette**: white background `#FFFFFF`, soft greys (`#F5F5F4`, `#E7E5E4`, `#A8A29E`), near-black text (`#0A0A0A`).
- **Typography**: serif display (Cormorant Garamond or Fraunces) for headings + clean sans-serif (Inter) for body — loaded via `<link>` in the root head.
- **Motion**: Framer Motion fade-in-on-scroll, gentle parallax on hero images, smooth-scroll, image hover zoom/desaturate transitions.
- **Layout**: generous whitespace, large imagery, thin hairline dividers, lowercase nav, wide letter-spacing on labels.

## Pages & Routes (TanStack file routes)

| Route | Purpose |
|---|---|
| `/` | Hero slideshow, intro, featured grid, CTA → `/booking` |
| `/portfolio` | Masonry gallery, optional category filter, lightbox |
| `/about` | Portrait, bio, story |
| `/booking` | Booking enquiry form (no pricing) |
| `/contact` | Contact form, email, Facebook, socials |
| `/auth` | Admin sign-in (email + password) |
| `/_authenticated/admin` | Admin dashboard: upload photos, manage categories, edit About/Home content, view booking enquiries |

Shared sticky translucent nav and footer (copyright, Facebook, quick links, contact).

## Backend (Lovable Cloud)

**Tables**
- `photos` — `id, storage_path, public_url, title, alt_text, category, sort_order, featured, width, height, created_at`
- `categories` — `id, slug, name, sort_order`
- `site_content` — single-row key/value for hero text, intro, about bio, portrait URL, social links
- `booking_enquiries` — `id, name, email, phone, event_type, preferred_date, message, created_at, status`
- `contact_messages` — `id, name, email, message, created_at`
- `user_roles` + `has_role()` security-definer fn — admin role gating

**RLS**
- Public `SELECT` on `photos`, `categories`, `site_content`
- Public `INSERT` on `booking_enquiries` and `contact_messages` (rate-limited via form validation)
- Admin-only writes on photos/categories/site_content; admin-only read on enquiries/messages

**Storage**
- Public bucket `photos` for gallery imagery; admin-only writes.

**Email (Lovable Emails)**
- Email domain setup required (prerequisite step) so enquiries can be delivered.
- Server route `/lovable/email/transactional/send` wired to a `booking-enquiry` React Email template that emails **nieve_blyth@icloud.com** on every booking/contact submission, plus an optional auto-acknowledgement to the enquirer.

## Admin Experience

- Sign in at `/auth` (email + password; first admin promoted via SQL on bootstrap).
- `/admin` tabs: **Photos** (drag-drop upload to Storage, set category/title/alt/order, delete), **Categories** (CRUD), **Content** (edit hero/intro/about/social URLs), **Enquiries** (read-only inbox).

## Technical

- TanStack Start, TanStack Query for data, Framer Motion for animation, React Email for templates, Zod for form validation.
- `loading="lazy"`, `decoding="async"`, responsive `srcset` via Supabase image transforms; blurred placeholders.
- SEO: per-route `head()` with unique title/description/OG; JSON-LD `LocalBusiness` on home; `robots.txt`; relative-path `sitemap.xml`.
- Accessibility: semantic landmarks, alt text on every image, focus-visible rings, 44px tap targets, `h-dvh` not `h-screen`.

## Open Item

The Facebook URL came through as "(9) Facebook" (looks like the browser tab title, not the URL). I'll wire it as an editable field in the admin Content panel so you can paste the real `https://facebook.com/...` link there once the site is up — no code change needed.

## Build Order

1. Enable Lovable Cloud; create schema, RLS, storage bucket, user_roles.
2. Auth + admin layout + role gate.
3. Public site shell (nav, footer, typography, tokens, animations).
4. Home, About, Contact, Booking pages with Cloud-backed content.
5. Portfolio masonry + lightbox + category filter.
6. Admin: photo uploader, content editor, enquiry inbox.
7. Email domain prompt + booking/contact email delivery.
8. SEO metadata, sitemap, robots, accessibility pass.
