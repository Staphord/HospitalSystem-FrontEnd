# Hospital Flow — React Frontend

Single-page application for the Hospital Patient Flow System. Connects to the **API Gateway** only — never to individual microservice ports.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Runs at `http://localhost:5173`. API calls proxy to `http://localhost:8000/api/v1` (api-gateway).

## Architecture

```
React SPA  →  API Gateway (:8000)  →  14 microservices
```

See [Hospital_Flow_Frontend_Project_Structure.md](./Hospital_Flow_Frontend_Project_Structure.md) for the full tree, route map, and role definitions.

Backend reference: `backend/microservicearchitecture.md`

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | API Gateway base URL |

## Build phases

| Phase | Modules | Backend services |
|-------|---------|------------------|
| 1 | auth, master, admin | auth-service, master-service, admin-service |
| 2 | reception, triage | reception-service, triage-service |
| 3 | consultation, lab, radiology, pharmacy | clinical services |
| 4 | billing, ward, notifications, reports | billing, ward, notification, report services |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
