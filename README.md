# Rootspiree · LevelUp World

LevelUp World is a social game about practising personal goals. Players choose a house, complete quests and share what they learn. The Game Master assigns quests, reviews submissions and awards points.

## Run locally

Use Node.js 22.13 or newer.

```sh
npm ci
npm run admin:create
npm run dev
```

The admin setup asks for an email address and a password of at least 12 characters. Use those credentials on the same login page as players. The admin can see account names, emails and signup status, assign quests and review submissions. To change the admin password, run the setup again with the same email address. Existing sessions for that admin are signed out.

To create a player, choose **Create an account**. Enter a name, email and password, then answer four optional questions about yourself. The existing 16-statement quiz follows. Once the quiz is complete, the house journey begins. The language switch is available in the welcome screens and the game.

## Run a production build

```sh
npm run build
npm start
```

The Node server serves the React build and the API on the same origin. It listens on `127.0.0.1:4173` by default. Set `HOST` and `PORT` to change the listening address. Behind an HTTPS reverse proxy, set `APP_ORIGIN` to the full public origin and `SECURE_COOKIES=true`. The server reads these variables from the environment or a local `.env` file.

SQLite stores accounts, sessions, profiles and gameplay in `data/rootspiree.sqlite` by default. Set `DATA_PATH` to use a persistent location and use the same path for the server and admin setup. For unattended admin setup, provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` through the environment. `ADMIN_NAME` is optional.

The four signup answers and quiz results are visible on the player's own profile. The player's bio is public within the game. A player can opt to share an individual quest goal with the Game Master. Original demo profiles in browser storage are separate from server accounts. Email is used as a login identifier. This release has no email verification or password-reset flow.

Run `npm test` for the game and account tests.
