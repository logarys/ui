# Logarys UI

SvelteKit web console for Logarys.

The UI connects to `logarys-console-manager` and provides:

- login with JWT bearer authentication;
- authenticated API calls;
- log search;
- pipeline views and admin configuration;
- profile management;
- admin user management.

## Stack

- SvelteKit 5
- TypeScript
- Static adapter
- Vite preview runtime served by Node.js
- `small-type-dependency-injection`

## Install

```bash
npm install
cp .env.example .env
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Docker

```bash
docker compose up --build
```

The UI is exposed on `http://localhost:5173` and served by `vite preview` inside the container.

## Environment

```env
PUBLIC_LOGARYS_API_URL=http://localhost:3002
```

`PUBLIC_LOGARYS_API_URL` must point to the console manager API.

## Authentication flow

The login page calls:

```http
POST /auth/login
```

Expected response from the API:

```json
{
  "accessToken": "jwt-token",
  "expiresIn": 43200,
  "user": {
    "id": "user-id",
    "name": "Administrator",
    "email": "admin@logarys.local",
    "isAdmin": true,
    "isEnabled": true
  }
}
```

After login, the UI stores:

```txt
access token
current user
```

Authenticated API requests automatically send:

```http
Authorization: Bearer jwt-token
```

If the API returns `401`, the UI clears the local auth state and redirects to `/login`.

## Routes

```txt
/login        public login page
/             authenticated dashboard entry
/logs         authenticated log search
/pipelines    authenticated pipeline view
/config       admin-only configuration
/profile      authenticated own profile edition
/admin/users  admin-only user management
```

## Permissions in the UI

| Page / action | Admin | Regular user |
|---|---:|---:|
| Login | yes | yes |
| Logs search | yes | yes |
| Pipeline view | yes | yes |
| Profile page | yes | yes |
| Edit own name/email/password | yes | yes |
| Admin configuration | yes | no |
| User list | yes | no |
| Create user | yes | no |
| Disable user | yes | no |
| Edit another user | yes | no |

The UI hides admin-only navigation entries for non-admin users.

The API is still the source of truth for permissions: hidden UI actions are not considered security controls by themselves.

## Login page

Route:

```txt
/login
```

The user enters:

```txt
email
password
```

On success:

- the JWT is saved;
- the current user is saved;
- admin users can access `/admin/users`;
- regular users are redirected to the main console.

## Profile page

Route:

```txt
/profile
```

Authenticated users can edit their own:

```txt
name
email
password
```

The UI calls:

```http
GET /users/me
PATCH /users/me
```

Regular users cannot update their own `isAdmin` or `isEnabled` fields.

## Admin user management

Route:

```txt
/admin/users
```

Admin users can:

- list users;
- create users;
- update users;
- enable or disable users;
- assign or remove admin rights.

The UI calls:

```http
GET    /users
POST   /users
PATCH  /users/:id
PATCH  /users/:id/disable
DELETE /users/:id
```

## Connected API actions

The UI calls the backend for these actions:

```txt
POST /auth/login
GET  /users/me
PATCH /users/me
GET  /users
POST /users
PATCH /users/:id
PATCH /users/:id/disable
DELETE /users/:id
GET  /pipelines
GET  /pipelines?query=...&inputType=...&enabled=...
POST /pipelines
GET  /logs?query=...&pipelineId=...&level=...&limit=...
```

List responses may be returned either directly as an array or wrapped in one of these shapes:

```json
{ "items": [] }
{ "data": [] }
{ "results": [] }
```

## First admin setup

The UI needs an existing admin user to log in.

Create one through the console manager env vars:

```env
ADMIN_INIT_ENABLED=true
ADMIN_EMAIL=admin@logarys.local
ADMIN_PASSWORD=change-me-password
ADMIN_NAME=Administrator
```

Or create one manually from the console manager project:

```bash
npm run user:create -- \
  --name "Administrator" \
  --email admin@logarys.local \
  --password "change-me-password" \
  --admin
```

Then log in at:

```txt
/login
```

## Development notes

When developing locally, make sure both services agree on the API URL:

```env
PUBLIC_LOGARYS_API_URL=http://localhost:3002
```

If the console manager runs on another port, update `.env` accordingly.
