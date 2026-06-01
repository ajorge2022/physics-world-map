# Physics World Map

Public city-level map for approved physicist profiles from a university network.

## Live URLs

- App: https://physics-world-map.vercel.app
- GitHub Pages redirect: https://ajorge2022.github.io
- Repository: https://github.com/ajorge2022/physics-world-map

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Leaflet / React Leaflet
- OpenStreetMap tiles

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run:

```bash
supabase/schema.sql
supabase/seed.sql
```

3. Copy environment variables:

```bash
cp .env.example .env.local
```

4. Fill in `.env.local`:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PHYSICS_MAP_ACCESS_PASSWORD=...
PHYSICS_MAP_ADMIN_PASSWORD=...
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is only used in server-side API routes.
- Public map data is fetched through `/api/profiles`; the browser never receives the service role key.
- Profile creation and editing are validated with Zod.
- Edit codes are generated with crypto-safe randomness and stored only as bcrypt hashes.
- New submissions and edits are set to `is_approved = false`.
- Public email is returned only when `show_email = true`.
- Only city-level latitude and longitude are stored.

## Pages

- `/` public map and filters
- `/add` shared-password protected profile form
- `/edit` profile lookup and edit form
- `/admin` password protected moderation and CSV export
- `/privacy` simple privacy policy

## Admin Flow

Use `/admin` with `PHYSICS_MAP_ADMIN_PASSWORD`. Pending profiles can be approved, rejected, hidden, or deleted. The CSV export includes approved public profiles.

## Geocoding

Profile creation geocodes `current_city + country` server-side through Nominatim. If geocoding fails, the form asks for manual city-level latitude and longitude.
