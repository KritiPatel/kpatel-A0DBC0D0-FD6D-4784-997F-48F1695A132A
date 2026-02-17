# Secure Task Management System

A full-stack task management application with role-based access control (RBAC), built as an NX monorepo with NestJS backend and Angular frontend.

## Setup Instructions

### Prerequisites

- **Node.js** v20+
- **PostgreSQL** 17 (via Homebrew: `brew install postgresql@17`)
- **npm** v10+

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

```bash
# Start PostgreSQL
brew services start postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

# Create the database
createdb taskmanager
```

### 3. Environment Configuration

The `.env` file is located at `apps/api/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dp
DB_PASSWORD=
DB_DATABASE=taskmanager

# JWT
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRATION=1d

# App
PORT=3000
```

Update `DB_USERNAME` to match your system username if different.

### 4. Run the Application

```bash
# Start the backend API (http://localhost:3000/api)
npx nx serve api

# In another terminal, start the frontend (http://localhost:4200)
npx nx serve dashboard
```

The database tables are auto-created on first run (TypeORM `synchronize: true`), and seed data is automatically inserted.

### 5. Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| owner@acme.com | password123 | Owner |
| admin@acme.com | password123 | Admin |
| viewer@acme.com | password123 | Viewer |
| admin@engineering.acme.com | password123 | Admin (child org) |

### 6. Run Tests

```bash
# RBAC guard tests
NODE_OPTIONS="--localstorage-file=/tmp/jest-ls" npx nx test auth

# Backend API tests (auth + tasks)
NODE_OPTIONS="--localstorage-file=/tmp/jest-ls-api" npx nx test api --runInBand

# Run all tests
NODE_OPTIONS="--localstorage-file=/tmp/jest-ls" npx nx run-many -t test --all --runInBand
```

> Note: `--localstorage-file` flag is needed for Node.js v25+ which has native localStorage requiring a file path.

---

## Architecture Overview

### NX Monorepo Layout

```
task-manager/
├── apps/
│   ├── api/               # NestJS backend (REST API)
│   │   └── src/app/
│   │       ├── auth/      # JWT authentication module
│   │       ├── tasks/     # Task CRUD with RBAC
│   │       ├── organizations/  # Org hierarchy management
│   │       ├── audit/     # Audit logging
│   │       ├── entities/  # TypeORM entities
│   │       └── seed/      # Database seeding
│   └── dashboard/         # Angular frontend
│       └── src/app/
│           ├── pages/     # Login, Dashboard components
│           ├── services/  # Auth, Task services + interceptor
│           └── store/     # NgRx state management
├── libs/
│   ├── data/              # Shared TypeScript interfaces, DTOs, enums
│   └── auth/              # Reusable RBAC decorators and guards
└── package.json
```

### Rationale

- **Monorepo (NX)**: Shared code between frontend and backend via `libs/`, single dependency tree, consistent tooling across apps.
- **Shared Libraries**:
  - `@task-manager/data`: All TypeScript interfaces, DTOs, and enums shared between frontend and backend — eliminates type drift.
  - `@task-manager/auth`: RBAC decorators (`@Roles()`) and guards (`RolesGuard`) reusable across any NestJS module.

---

## Data Model

### Entity Relationship Diagram

```
organizations                users
-----------------            ----------------------
id         (PK, UUID)        id         (PK, UUID)
name                         email      (UNIQUE)
parent_id  (FK → self)       password   (hashed)
created_at                   first_name
updated_at                   last_name
                             role       (ENUM)
  * parent_id references     organization_id (FK → organizations)
    itself for 2-level        created_at
    hierarchy                 updated_at


tasks                        audit_logs
---------------------        ---------------------
id         (PK, UUID)        id         (PK, UUID)
title                        user_id    (FK → users)
description                  action     (ENUM)
status     (ENUM)            resource
category   (ENUM)            resource_id
priority   (ENUM)            details
position   (INT)             ip_address
user_id    (FK → users)      created_at
organization_id (FK → organizations)
created_at
updated_at
```

### Schema Description

- **Organizations**: 2-level hierarchy (parent → child). `parent_id` is self-referencing FK — null for root orgs.
- **Users**: Each user belongs to one organization and has a single role. Passwords are bcrypt-hashed.
- **Tasks**: Assigned to a user and scoped to an organization. `position` field supports drag-and-drop reordering.
- **Audit Logs**: Immutable log of user actions with IP tracking.

### Enums

- **Role**: `owner`, `admin`, `viewer`
- **TaskStatus**: `todo`, `in_progress`, `done`
- **TaskCategory**: `work`, `personal`
- **TaskPriority**: `low`, `medium`, `high`
- **AuditAction**: `CREATE`, `READ`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`

---

## Access Control Implementation

### Role and Permission Hierarchy

```
Owner ──► Admin ──► Viewer
  │         │         │
  │         │         └── Read-only access to own org tasks
  │         └── CRUD tasks in own org, read child org tasks
  └── Full CRUD across own org + all child orgs
```

**Role inheritance** is implemented in `RolesGuard`:
- `Owner` inherits all `Admin` and `Viewer` permissions
- `Admin` inherits all `Viewer` permissions
- Decorating a route with `@Roles(Role.ADMIN)` allows both Admin and Owner access

### Organization Hierarchy

```
Acme Corporation (parent)
├── Acme Engineering (child)
└── ... (more child orgs)
```

- **Owner**: Sees and manages tasks from own org + all child orgs
- **Admin**: Sees tasks from own org + child orgs, can only edit/delete in own org
- **Viewer**: Sees tasks from own org only, cannot create/edit/delete

### JWT Authentication and Access Control Integration

1. User calls `POST /api/auth/login` with email/password
2. Server validates credentials against bcrypt hash
3. Server returns JWT containing `{ sub, email, role, organizationId }`
4. Client stores JWT in localStorage
5. Client attaches JWT via `Authorization: Bearer <token>` header (Angular interceptor)
6. `JwtAuthGuard` validates token on every protected route
7. `RolesGuard` checks role permissions against `@Roles()` decorator
8. Audit log records login event

### Guard Stack (per request)

```
Request → JwtAuthGuard → RolesGuard → Controller → Service (org-scoped queries)
```

`JwtAuthGuard` validates the token. `RolesGuard` checks the user's role against the `@Roles()` decorator. The service layer then further scopes database queries by organization hierarchy.

---

## API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login, returns JWT | No |
| POST | `/api/auth/register` | Register new user | No |
| GET | `/api/auth/profile` | Get current user profile | JWT |

#### POST /api/auth/login

**Request:**
```json
{
  "email": "owner@acme.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "owner@acme.com",
    "firstName": "Alice",
    "lastName": "Owner",
    "role": "owner",
    "organizationId": "uuid"
  }
}
```

### Tasks

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/tasks` | Create task | JWT | Owner, Admin |
| GET | `/api/tasks` | List accessible tasks | JWT | All |
| GET | `/api/tasks/:id` | Get task by ID | JWT | All |
| PUT | `/api/tasks/:id` | Update task | JWT | Owner, Admin |
| DELETE | `/api/tasks/:id` | Delete task | JWT | Owner, Admin |
| PUT | `/api/tasks/reorder/batch` | Reorder/move task | JWT | Owner, Admin |

#### POST /api/tasks

**Request:**
```json
{
  "title": "Implement RBAC",
  "description": "Add role-based access control",
  "status": "todo",
  "category": "work",
  "priority": "high"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Implement RBAC",
  "description": "Add role-based access control",
  "status": "todo",
  "category": "work",
  "priority": "high",
  "position": 0,
  "userId": "uuid",
  "organizationId": "uuid",
  "createdAt": "2026-02-15T00:00:00.000Z",
  "updatedAt": "2026-02-15T00:00:00.000Z"
}
```

#### GET /api/tasks (query parameters)

- `status`: `todo` | `in_progress` | `done`
- `category`: `work` | `personal`
- `priority`: `low` | `medium` | `high`
- `search`: Free text search (title/description)
- `sortBy`: `createdAt` | `updatedAt` | `priority` | `position` | `title`
- `sortOrder`: `ASC` | `DESC`

### Audit Log

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/audit-log` | View access logs | JWT | Owner, Admin |

### Organizations

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/organizations` | List all orgs | JWT | All |
| GET | `/api/organizations/:id` | Get org by ID | JWT | All |
| POST | `/api/organizations` | Create org | JWT | Owner |

---

## Testing Strategy

### Backend Tests (34 total)

**RBAC Guard Tests** (`libs/auth/`) — 10 tests:
- Role hierarchy verification (Owner > Admin > Viewer)
- Permission inheritance
- Access denial for insufficient roles
- Edge cases (no roles required, no user in request)

**Auth Service Tests** (`apps/api/`) — 8 tests:
- Login with valid/invalid credentials
- Password hashing verification
- Registration with duplicate email prevention
- Organization validation
- Audit log creation on login

**Task Service Tests** (`apps/api/`) — 16 tests:
- CRUD operations with role enforcement
- Organization-scoped access (own org, child orgs)
- Viewer restriction (read-only)
- Admin restriction (can't modify child org tasks)
- Owner full access across org hierarchy
- Audit logging on create/update/delete

### Running Tests

```bash
# All backend tests
NODE_OPTIONS="--localstorage-file=/tmp/jest-ls" npx nx test api --runInBand
NODE_OPTIONS="--localstorage-file=/tmp/jest-ls" npx nx test auth
```

---

## Tradeoffs and Decisions

### What's Implemented
- Full JWT authentication (login, register, token verification)
- Complete RBAC with role hierarchy and org-scoped access
- Task CRUD with Kanban board (drag-and-drop between columns)
- NgRx state management
- Audit logging (login, CRUD operations)
- Search, filter, and sort functionality
- Task completion progress bar (bonus visualization)
- Responsive design (mobile to desktop)
- 34 unit tests covering RBAC, auth, and task logic

### Tradeoffs Made
- **TypeORM `synchronize: true`**: Used for rapid development. In production, this would use migrations.
- **No refresh tokens**: JWT expires in 1 day. Production would implement refresh token rotation.
- **No CSRF protection**: Not needed for API-only JWT auth (tokens aren't auto-sent by browser).
- **Console audit logging**: Stored in PostgreSQL. Production would add structured logging (Winston/Pino) with log aggregation.
- **No frontend unit tests**: Prioritized backend RBAC/auth tests which are the core of the assessment.

---

## Future Considerations

- **Advanced Role Delegation**: Allow Owners to delegate specific permissions to individual users beyond the fixed role hierarchy.
- **JWT Refresh Tokens**: Implement refresh token rotation with sliding window expiration to reduce re-authentication friction.
- **CSRF Protection**: Add CSRF tokens if supporting cookie-based auth alongside JWT.
- **RBAC Caching**: Cache permission lookups in Redis to reduce database queries per request.
- **Efficient Scaling of Permission Checks**: Move from per-request DB queries to a pre-computed permission matrix, enabling O(1) access control decisions at scale.
