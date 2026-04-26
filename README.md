# Logarys UI

SvelteKit web console for Logarys.

## Stack

- SvelteKit 5
- TypeScript
- Static adapter
- Caddy runtime image
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

The UI is exposed on `http://localhost:5173`.

## Environment

```env
PUBLIC_LOGARYS_API_URL=http://localhost:3000
```

## Connected API actions

The UI now calls the backend for these actions:

```txt
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
