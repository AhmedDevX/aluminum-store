# Aluminum Store — Backend

Node.js + Express + MySQL API, plus a Socket.IO server for the real-time
chat. Matches the `src/api/client.js` contract used by the frontend
exactly.

## Local setup

1. Create a MySQL database (locally or via any provider) and run the schema:
   ```
   mysql -u root -p -e "CREATE DATABASE aluminum_store"
   mysql -u root -p aluminum_store < src/db/schema.sql
   ```
2. Copy `.env.example` to `.env` and fill in your database credentials and
   a `JWT_SECRET`.
3. Install dependencies and create the admin account + sample products:
   ```
   npm install
   npm run seed
   ```
4. Start the server:
   ```
   npm run dev
   ```
   It listens on `http://localhost:4000` by default, with the API under
   `/api` and the chat socket on the same port — matching
   `VITE_API_URL=http://localhost:4000/api` in the frontend's `.env`.

## Deploying (Railway or Render)

1. Push this `backend/` folder to a Git repo (or a `backend` subfolder of
   your existing repo — set the service's root directory accordingly).
2. Add a MySQL database from the platform's marketplace/add-ons. It will
   give you a connection string — set it as the `DATABASE_URL` environment
   variable on the backend service (Railway names its variable
   `MYSQL_URL`/`MYSQL_PUBLIC_URL`; copy its value into `DATABASE_URL`, or
   add `DATABASE_URL` as an alias pointing to the same value).
3. Set the rest of the environment variables from `.env.example`:
   `JWT_SECRET` (generate a real random string), `CORS_ORIGIN` (your
   deployed frontend's exact URL), and `SEED_ADMIN_*` if you plan to run
   the seed script there too.
4. Run the schema once against the hosted database — either via the
   platform's MySQL console/CLI, or temporarily from your machine:
   ```
   mysql -h <host> -P <port> -u <user> -p <database> < src/db/schema.sql
   ```
5. Set the start command to `npm start` and deploy. Once it's live, run
   `npm run seed` once (via the platform's one-off command/shell feature)
   to create the admin account and sample products.
6. Update the frontend's `VITE_API_URL` to point at the deployed backend,
   e.g. `https://your-backend.up.railway.app/api`, and rebuild/redeploy
   the frontend.

## API overview

All endpoints are under `/api`. Protected ones need `Authorization: Bearer <token>`.

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /products`, `GET /products/:id` (public)
- `POST /products`, `PUT /products/:id`, `DELETE /products/:id` (admin)
- `POST /quote-requests` (auth), `GET /quote-requests/mine` (auth)
- `GET /quote-requests/admin/all`, `PATCH /quote-requests/admin/:id/status` (admin)
- `POST /contact-messages` (auth)
- `GET /contact-messages/admin/all`, `PATCH /contact-messages/admin/:id/status` (admin)
- `GET /chat/history` (auth), `GET /chat/admin/conversations`,
  `GET /chat/admin/:userId/history` (admin)
- Socket.IO on the same server/port, authenticated via
  `{ auth: { token } }` on connection; events: `message` (in/out),
  `admin:watch` (admin only).
