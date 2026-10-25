# WorkBuddy

WorkBuddy is a full-stack team collaboration and project management app with a sketchbook-inspired interface. It brings project planning, task tracking, chat, and collaborative notes into one workspace.

## Features

- Account registration, login, and profile settings
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
FRONTEND_URL=http://localhost:5173
```

`FRONTEND_URL` accepts comma-separated origins. The database connection also accepts `MONGODB_URI` and the legacy spelling `MOGODB_URI`; use just one database URI variable. Without one, the backend defaults to `mongodb://localhost:27017/doodlesaas`.

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

## Demo data

To populate a development database:

```bash
npm --prefix Project run seed
```

**This deletes existing data in the configured database before creating demo records. Use a dedicated development database.**

Seeded accounts all use the password `password123`:

| Email | Role |
| --- | --- |
| `pm@workbuddy.com` | Project Manager |
| `frontend@workbuddy.com` | Frontend Dev |
| `backend@workbuddy.com` | Backend Dev |
| `uiux@workbuddy.com` | UI UX Person |
| `qa@workbuddy.com` | Observer |
| `creator@workbuddy.com` | Admin |

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

Back up existing data before running the v2 migration. It updates legacy users, project memberships, task assignees, and organization references. It is not needed for a fresh database populated by the current seed script.

There is no automated test suite configured; the backend `test` script is a placeholder that exits with an error.

## How it works

The React app sends REST requests through `src/services/api.js`. The client attaches the JWT from localStorage and redirects to login on a `401` response. Express routes authenticate requests, call controllers, and persist data through Mongoose.

Each project workspace loads project details, messages, whiteboard notes, and tasks through REST, then connects to an authenticated Socket.IO project room. Chat and whiteboard changes are persisted by socket handlers. Task changes are saved through REST and relayed to other clients through socket events.

Managers and admins can create and edit projects and add teammates. Other users access projects through `ProjectMember` records. Project deletion also checks the creator, with an admin override.

Uploads are stored in `Project/backend/uploads/` and served under `/uploads`. The current upload limit is 10 MB per file, with JPEG, PNG, WebP, PDF, plain text, and Word document types accepted.

## Current limitations

- The calendar displays a fixed October 2024 grid and filters upcoming events to October/November 2024.
- Registration places users in the default `WorkBuddy Studio` organization; separate organization onboarding is not implemented.
- Adding a teammate creates an account with a generated password; email invitations and an account acceptance flow are not implemented.
- Role templates, ratings, and collaboration metrics have database schemas but no corresponding API routes or application screens.
- Production deployment needs further authentication and authorization review. Registration accepts a role, and JWT handling includes a development fallback secret.
- The backend serves the API and uploads; hosting the frontend build requires a separate static host with SPA route fallback.

See [the developer documentation](WorkBuddy_Developer_Documentation.md) for a longer module walkthrough. Some details there predate the organization and project membership migration; this README uses the current configuration names.
