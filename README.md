# Rootspiree · LevelUp World

LevelUp World is a social game about practising personal goals. Players choose a house, complete quests and share what they learn. The Game Master assigns quests, reviews submissions and awards points.

## Run locally

Use Node.js 22.13 or newer.

```sh
cp -n .env.example .env
npm ci
npm run admin:create
npm run dev
```

On Windows PowerShell, use these commands.

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd ci
npm.cmd run admin:create
npm.cmd run dev
```

The template has the local server and database settings. The admin setup asks for your email and a password of at least 12 characters. To skip the prompts, enter your own values for `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your local `.env` before running the setup. You can clear those two values from the file once the account is created.

The admin logs in on the same page as players and can view accounts, assign quests and review submissions. To change the admin password, run setup again with the same email address. Existing sessions for that admin are signed out.

To create a player, choose **Create an account**. Enter a name, email and password, then answer four optional questions about yourself. The 76-statement quiz takes you to your personality report, where you can see your trait scores and explore the 16 illustrated types. Choose **Continue to game** to begin the house journey. You can reopen the report or retake the quiz from your profile. The language switch is available in the welcome screens and the game.

## Customize the theme

Edit the variables at the top of [`src/theme.css`](src/theme.css). The public pages, Game Master dashboard and player screens all use this file.

- Change `--color-accent`, `--color-accent-hover` and `--color-on-accent` for the primary buttons.
- Change `--color-bg`, `--color-sidebar`, `--color-surface` and `--color-text` for the main colors.
- Change `--color-hero-start`, `--color-hero-middle` and `--color-hero-end` for the banner gradient.
- Change `--font-sans`, `--font-display`, `--radius-*`, `--space-*` and `--sidebar-width` for typography and layout.

The dev server applies stylesheet edits as you save them.

## Run a production build

```sh
npm run build
npm start
```

The Node server serves the React build and the API on the same origin. It listens on `127.0.0.1:4173` by default. Set `HOST` and `PORT` to change the listening address. Behind an HTTPS reverse proxy, set `APP_ORIGIN` to the full public origin and `SECURE_COOKIES=true`. The server reads these variables from the environment or a local `.env` file.

SQLite stores accounts, sessions, profiles and gameplay in `data/rootspiree.sqlite` by default. Set `DATA_PATH` to use a persistent location and use the same path for the server and admin setup. For unattended admin setup, provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` through the environment. `ADMIN_NAME` is optional.

## Deploy to Vercel

Import this repository as a Vite project. Vercel builds the frontend from `main` and runs the handlers under `api/`. Use Node.js 24.x or a newer Vercel-supported version.

1. Apply the SQL under `supabase/migrations/` to create the private `levelup` schema in Supabase.
2. Set a strong password and enable login for the `levelup_app` database role. Copy the Supabase transaction pooler URI from the Connect dialog and use `levelup_app.<project-ref>` as its username. Save the URI as the sensitive Production variable `LEVELUP_DATABASE_URL` in Vercel. The game verifies TLS and keeps this connection server-side. Use a separate database for Preview if you enable its backend.
3. Set the Production environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` if you want a first Game Master account. Use a unique password of at least 12 characters. `ADMIN_NAME` is optional and defaults to Game Master.
4. Redeploy. Open the game and log in once with the Game Master credentials to initialize the account. Then remove the bootstrap variables and redeploy again.

Vercel stores accounts, sessions, and world progress in the `levelup` schema. The Supabase Data API has no access to those tables. The local development server still uses SQLite. Existing local accounts and progress are separate from the hosted world.

The four signup answers and quiz results are visible on the player's own profile. The player's bio is public within the game. A player can opt to share an individual quest goal with the Game Master. Original demo profiles in browser storage are separate from server accounts. Email is used as a login identifier. This release has no email verification or password-reset flow.

Run `npm test` for the game and account tests.
