# WorkBuddy

WorkBuddy is a full-stack team collaboration and project management app with a sketchbook-inspired interface. It brings project planning, task tracking, chat, and collaborative notes into one workspace.

## Features

- Invite-only accounts, first-login password setup, and account suspension
- Company hierarchy with access roles, job titles, departments, teams, reporting lines, and employee IDs
- Targeted announcements with priorities, pinning, read state, and audience controls
- Project creation, progress tracking, and collaborator management
- Personal and project tasks with statuses, categories, assignees, and due dates
- Project chat with replies, reactions, mentions, typing indicators, and read receipts
- Shared whiteboard with movable, resizable, colored, and pinned sticky notes
- File attachments in project conversations
- Team directory, team wall notes, calendar events, and activity feeds
- Organization-scoped records and project membership checks

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4 |
| API client | Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose 8 |
| Authentication | JSON Web Tokens, bcrypt |
| Real-time updates | Socket.IO |
| File uploads | Multer, local disk storage |
| Email invitations | Resend HTTP API |

## Project structure

```text
WorkBuddy/
├── README.md
├── WorkBuddy_Developer_Documentation.md
└── Project/
    ├── package.json             # Commands for running both apps
    ├── backend/
    │   ├── src/
    │   │   ├── config/         # Database connection
    │   │   ├── controllers/    # API business logic
    │   │   ├── middleware/     # Authentication and role checks
    │   │   ├── models/         # Mongoose schemas
    │   │   ├── routes/         # REST endpoints
    │   │   ├── utils/          # Organization scoping helpers
    │   │   ├── server.js
    │   │   ├── socketHandler.js
    │   │   ├── seed.js
    │   │   └── migrate-v2.js
    │   └── test-connection.js
    └── frontend/
        ├── constant.js         # Backend URL configuration
        └── src/
            ├── components/    # Shared layout, header, and sidebar
            ├── pages/         # Application screens
            ├── services/      # Central Axios API client
            └── App.jsx        # Routes and authentication guard
```

## Local setup

### Prerequisites

- Node.js 22.12 or newer and npm
- A running MongoDB instance, locally or through MongoDB Atlas

Run the following commands from the repository root.

### 1. Install dependencies

```bash
npm --prefix Project/backend ci
npm --prefix Project/frontend ci
```

### 2. Configure the backend

Create `Project/backend/.env`:

```dotenv
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/workbuddy
JWT_SECRET=replace-with-a-long-random-secret
SUPPORT_JWT_SECRET=replace-with-a-separate-long-random-secret
FRONTEND_URL=http://localhost:5173
CONTROL_DB_NAME=workbuddy_control
# Optional comma-separated DNS fallback for mongodb+srv lookup failures
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
# Optional in local development; required to deliver invitation emails
RESEND_API_KEY=re_your_api_key
MAIL_FROM=WorkBuddy <onboarding@resend.dev>
MAIL_REPLY_TO=teamworkbuddy@proton.me
```

`FRONTEND_URL` accepts comma-separated origins. The database connection also accepts `MONGODB_URI` and the legacy spelling `MOGODB_URI`; use just one database URI variable. Without one, the backend defaults to `mongodb://localhost:27017/doodlesaas`. For Atlas `mongodb+srv` URLs, the backend automatically retries DNS lookup failures with Cloudflare and Google DNS. Set `MONGODB_DNS_SERVERS` to override those fallback servers.

When `RESEND_API_KEY` is absent, invitations are not emailed and the development invite URL is returned to the CEO/HR screen and printed by the backend. During development, Resend's `onboarding@resend.dev` test sender is used and replies are directed to `MAIL_REPLY_TO`. In production, configure a Resend API key and change `MAIL_FROM` to an address on a domain verified in Resend.

The `workbuddy_control` database is the platform registry. Its `control_companies` collection stores the public company ID, owner, subscription summary, lifecycle status, tenant database name, contact information, and synchronized user/project counts. Each company's operational data remains isolated in its own tenant database. Synchronize existing registry records with:

```bash
cd Project/backend
npm run sync:companies
```

To copy legacy control collections from the MongoDB URI's default database into the separate `workbuddy_control` database, run `npm run migrate:control-db`. The command verifies documents and indexes and retains the source collections as a rollback backup.

### 3. Configure the frontend

Create `Project/frontend/.env`:

```dotenv
VITE_BACKEND_URL=http://localhost:3001
```

The frontend defaults to this URL when the variable is absent. Restart Vite after changing environment variables. Both `.env` files are ignored by Git.

### 4. Start the app

Run these commands in separate terminals:

```bash
npm --prefix Project/backend run dev
```

```bash
npm --prefix Project/frontend run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:3001](http://localhost:3001).

Alternatively, run `npm --prefix Project start` to launch both processes. This command uses `npx concurrently`, which may prompt to download the runner on first use.

## Initial company administrator

There is no public signup. The WorkBuddy operations team provisions each organization's first CEO or HR account with the backend-only command below:

```bash
PROVISION_ORG="Acme" \
PROVISION_NAME="Aarav Mehta" \
PROVISION_EMAIL="ceo@acme.com" \
PROVISION_PASSWORD="a-long-temporary-password" \
PROVISION_ROLE="CEO" \
npm --prefix Project/backend run provision:admin
```

After login, that CEO or HR user invites employees from **People & hierarchy**. Each employee receives a single-use link valid for 72 hours and creates their password on first access. The account becomes active only after this step.

The provisioning command creates a record in `workbuddy_control`, allocates a dedicated database named `workbuddy_company_<random-id>`, creates the tenant organization and first administrator there, registers the central login identity, and creates the initial subscription record.

### WorkBuddy support accounts

Support agents are separate from company users and use a different JWT secret and internal API namespace:

```bash
SUPPORT_NAME="WorkBuddy Support" \
SUPPORT_EMAIL="support@workbuddy.example" \
SUPPORT_PASSWORD="a-long-support-password" \
npm --prefix Project/backend run provision:support
```

Support agents cannot use company APIs. Company accounts cannot use internal support APIs. A support agent can view company diagnostics only while a CEO/HR grant for the related ticket is active and includes `READ_DIAGNOSTICS`. Grants expire after at most 72 hours, can be revoked early, and diagnostic access is written to the central audit log.

## Commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm --prefix Project start` | Start frontend and backend together |
| `npm --prefix Project run backend` | Start backend with Nodemon |
| `npm --prefix Project run frontend` | Start the Vite development server |
| `npm --prefix Project run test-db` | Check MongoDB connectivity and collection counts |
| `npm --prefix Project run seed` | Replace database contents with demo data |
| `npm --prefix Project run migrate:v2` | Migrate legacy records to the organization and membership schema |
| `npm --prefix Project/frontend run build` | Build frontend into `Project/frontend/dist/` |
| `npm --prefix Project/frontend run preview` | Preview the frontend build locally |
| `npm --prefix Project/frontend run lint` | Run frontend ESLint checks |
| `npm --prefix Project/backend start` | Start backend without Nodemon |
| `npm --prefix Project/backend run provision:admin` | Provision the first CEO/HR account using environment variables |
| `npm --prefix Project/backend run provision:support` | Provision a WorkBuddy internal support account |

Back up existing data before running the v2 migration. It updates legacy users, project memberships, task assignees, and organization references. It is not needed for a fresh database populated by the current seed script.

There is no automated test suite configured; the backend `test` script is a placeholder that exits with an error.

## How it works

The React app sends REST requests through `src/services/api.js`. The client attaches the JWT from localStorage and redirects to login on a `401` response. Express routes authenticate requests, call controllers, and persist data through Mongoose.

Each project workspace loads project details, messages, whiteboard notes, and tasks through REST, then connects to an authenticated Socket.IO project room. Chat and whiteboard changes are persisted by socket handlers. Task changes are saved through REST and relayed to other clients through socket events.

### Multi-company database isolation

MongoDB uses a control-plane plus database-per-company layout:

- `workbuddy_control` contains company routing, login identities, subscription references, support tickets, time-limited access grants, internal support accounts, and audit logs.
- Every company receives a separate `workbuddy_company_<random-id>` database containing its employees, projects, tasks, chats, messages, announcements, events, and other workspace records.
- JWTs contain the immutable control-plane company ID. The backend resolves the database name server-side and binds every Mongoose model to that database using request-local async context. Clients never supply database names.
- Socket.IO connections perform the same company lookup and run events inside the resolved tenant context.

Subscription data is available only through the CEO-protected API and UI. Payment card data is not stored in WorkBuddy; only payment-provider references belong in the control database.

CEO and HR users have company-wide project and chat access. Managers and Team Heads administer assigned projects, while employees access projects through `ProjectMember` records. CEO and HR control accounts, access roles, reporting lines, transfers, and suspension. Team Heads can update job titles for employees in their own team.

Uploads are stored in `Project/backend/uploads/` and served under `/uploads`. The current upload limit is 10 MB per file, with JPEG, PNG, WebP, PDF, plain text, and Word document types accepted.

## Current limitations

- The calendar displays a fixed October 2024 grid and filters upcoming events to October/November 2024.
- Role templates, ratings, and collaboration metrics have database schemas but no corresponding API routes or application screens.
- The initial CEO/HR provision command uses a supplied password; production operations should deliver it through a secure channel and require a rotation policy.
- The backend serves the API and uploads; hosting the frontend build requires a separate static host with SPA route fallback.

See [the developer documentation](WorkBuddy_Developer_Documentation.md) for a longer module walkthrough. Some details there predate the organization and project membership migration; this README uses the current configuration names.
