# DAHAB DIVE CENTER — Full-Stack Project

A full-stack diving-center booking starter for the AAST AI project.

- **Frontend:** React + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL on Supabase
- **Authentication:** Custom login with Argon2id password hashing and HTTP-only JWT cookies (not Supabase Auth)

## Project structure

```text
DAHAB-DIVE-CENTER/
├── database/
│   └── demo_data_optional.sql
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   └── package.json
├── server/                 # Express + TypeScript backend
│   ├── scripts/
│   │   └── create-receptionist.ts
│   ├── src/
│   ├── .env.example
│   └── package.json
├── schema_update.sql
└── README.md
```

## 1. Open the project in VS Code

1. Download and extract the ZIP file.
2. In VS Code, choose **File → Open Folder**.
3. Select the extracted `DAHAB-DIVE-CENTER` folder (the one containing `client`, `server`, and `schema_update.sql`).
4. Open **Terminal → New Terminal**.

You need Node.js 20 or newer and an existing Supabase project.

## 2. Prepare the Supabase database

1. Open your Supabase project.
2. Open **SQL Editor → New query**.
3. Open `schema_update.sql` from this project, copy all its contents, paste them into the SQL Editor, and run it.
4. The migration is additive: it does not drop tables or delete existing rows.
5. Optional: if you want demo instructors and future sessions to appear in the app, run `database/demo_data_optional.sql` as a separate query. This is separate from the migration and can be skipped.

The frontend needs scheduled rows in `public.diving_sessions` to show bookable dives. The optional SQL creates three example future sessions.

## 3. Configure the backend

In VS Code, create a file named `.env` inside the `server` folder by copying `server/.env.example`.

Fill in:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=YOUR_SUPABASE_POSTGRES_CONNECTION_STRING
JWT_SECRET=PUT_A_RANDOM_SECRET_HERE_AT_LEAST_32_CHARACTERS_LONG
FRONTEND_URL=http://localhost:5173
```

Get the PostgreSQL connection string from your Supabase project's **Connect** menu. Use the recommended connection/pooler option for your environment. Keep this file private. Never put `DATABASE_URL` or `JWT_SECRET` in the frontend.

## 4. Install and run the backend

Open a VS Code terminal:

```bash
cd server
npm install
npm run dev
```

Keep this terminal running. Check that the API is responding by opening:

`http://localhost:5000/api/health`

You should see a message that the DAHAB DIVE CENTER API is running.

## 5. Install and run the frontend

Open a **second** VS Code terminal (leave the backend terminal running):

```bash
cd client
npm install
```

Create `client/.env` by copying `client/.env.example`. For local development, it should contain:

```env
VITE_API_URL=http://localhost:5000
```

Then run:

```bash
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`).

## 6. Create a receptionist account (optional)

Customer accounts can register from the website. Receptionist accounts must be created by the project owner; there is no public receptionist registration.

1. Stop the backend terminal with `Ctrl + C`.
2. Add these temporary values to `server/.env`:

```env
RECEPTIONIST_NAME=Reception Desk
RECEPTIONIST_EMAIL=reception@example.com
RECEPTIONIST_PASSWORD=ChooseAStrongPassword123!
```

3. In the backend terminal, run:

```bash
npm run create:receptionist
```

4. Remove the three `RECEPTIONIST_...` lines from `.env` after the account is created.
5. Start the backend again with `npm run dev`.
6. Sign in on the website using the receptionist email and password. The Reception desk page will appear.

Do not commit `.env` or share the receptionist password.

## 7. Push the project to GitHub from VS Code

1. In VS Code, open the **Source Control** icon on the left.
2. Click **Initialize Repository** if Git is not initialized yet.
3. Make sure `.env` files and `node_modules` are not listed as files to commit. The `.gitignore` files exclude them.
4. Enter a commit message, for example `Add DAHAB DIVE CENTER full-stack project`, and click **Commit**.
5. Click **Publish Branch** or **Publish to GitHub** and choose your repository `kokshany42-creator/aiproject`.

If you prefer the VS Code terminal, run these commands from the project root:

```bash
git init
git add .
git status
git commit -m "Add DAHAB DIVE CENTER full-stack project"
git branch -M main
git remote add origin https://github.com/kokshany42-creator/aiproject.git
git push -u origin main
```

If `git remote add origin` says the remote already exists, use:

```bash
git remote set-url origin https://github.com/kokshany42-creator/aiproject.git
git push -u origin main
```

GitHub may ask you to sign in through your browser. Never put your GitHub password or token inside project files.

## Main features included

### Customer
- Create an account and sign in.
- Browse scheduled diving sessions.
- Choose an instructor (optional) and submit a booking request.
- View personal bookings and booking status.

### Receptionist
- Sign in with a provisioned receptionist account.
- View all customer bookings.
- Change a booking to pending, confirmed, or cancelled.

### Backend API

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public customer registration |
| POST | `/api/auth/login` | Customer/receptionist |
| POST | `/api/auth/logout` | Public |
| GET | `/api/auth/me` | Signed in |
| GET | `/api/sessions` | Signed in |
| GET | `/api/instructors` | Signed in |
| GET | `/api/customers/me` | Customer |
| POST | `/api/bookings` | Customer |
| GET | `/api/bookings/my` | Customer |
| GET | `/api/bookings` | Receptionist |
| PATCH | `/api/bookings/:id/status` | Receptionist |

## Important notes

- This is a student-project starter, not a production-audited system.
- The booking API protects session capacity and prevents duplicate customer/session bookings.
- The starter does not yet write to `booking_history`, enforce instructor availability, or include automated tests and pagination.
- Before production, add a robust CSRF strategy and test cookie behavior in all target browsers. Cookies across unrelated Vercel and Render domains can be blocked by third-party-cookie restrictions. A same-site custom-domain setup is preferable.
- Do not disable PostgreSQL SSL certificate verification to work around a certificate error. Configure the correct Supabase connection and CA certificate instead.
