# Hospital Patient Flow System — React Frontend Project Structure

**Version:** 2.0 | **Framework:** React 19 + Vite + TypeScript | **Architecture:** Feature-based SPA → API Gateway

---

## Overview

This is a **single React SPA** that talks to one entry point — the **API Gateway** (`:8000`). The frontend does **not** call individual microservice ports directly.

The app is organized in three layers:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Data** | `src/api/` | HTTP client, API types, service functions |
| **Logic** | `src/hooks/`, `src/store/`, `src/lib/` | Auth state, permissions, token handling |
| **UI** | `src/features/`, `src/components/`, `src/app/layout/` | Pages, forms, shared components |

Each `src/features/` folder maps to a **user workflow domain**, which aligns with a backend microservice — but the frontend stays one app.

---

## Backend Microservices Alignment

See `backend/microservicearchitecture.md` for the full backend plan.

| Microservice | Port | Frontend feature | API service file |
|--------------|------|------------------|------------------|
| `api-gateway` | 8000 | *(all requests go here)* | `api/client.ts` |
| `auth-service` | 8001 | `features/auth/` | `api/services/auth.ts` |
| `master-service` | 8002 | `features/master/` | `api/services/master.ts` |
| `reception-service` | 8010 | `features/reception/` | `api/services/reception.ts` |
| `triage-service` | 8011 | `features/triage/` | `api/services/triage.ts` |
| `consultation-service` | 8012 | `features/consultation/` | `api/services/consultation.ts` |
| `laboratory-service` | 8013 | `features/laboratory/` | `api/services/laboratory.ts` |
| `radiology-service` | 8014 | `features/radiology/` | `api/services/radiology.ts` |
| `pharmacy-service` | 8015 | `features/pharmacy/` | `api/services/pharmacy.ts` |
| `billing-service` | 8016 | `features/billing/` | `api/services/billing.ts` |
| `ward-service` | 8017 | `features/ward/` | `api/services/ward.ts` |
| `admin-service` | 8018 | `features/admin/` | `api/services/admin.ts` |
| `notification-service` | 8019 | `features/notifications/` | `api/services/notifications.ts` |
| `report-service` | 8020 | `features/reports/` | `api/services/reports.ts` |

> **Important:** RabbitMQ events are backend-only. The frontend uses HTTP (and optionally WebSocket/SSE later for live notifications).

---

## Build Phases

| Phase | Services | Frontend modules |
|-------|----------|------------------|
| 1 | auth, master, admin | Login, master portal, hospital user management |
| 2 | reception, triage | Patient registration, visit queue, triage |
| 3 | consultation, laboratory, radiology, pharmacy | Clinical workflow |
| 4 | billing, ward, notification, report | Billing, inpatient, notifications, analytics |

---

## Full Project Tree

```
frontend/
│
├── .env                              # VITE_API_BASE_URL=http://localhost:8000/api/v1
├── .env.example
├── package.json
├── vite.config.ts                    # Dev proxy → api-gateway :8000
├── README.md
├── Hospital_Flow_Frontend_Project_Structure.md
│
└── src/
    ├── main.tsx
    ├── App.tsx
    │
    ├── app/
    │   ├── providers/
    │   │   ├── AppProviders.tsx
    │   │   ├── QueryProvider.tsx
    │   │   └── AuthProvider.tsx
    │   ├── router/
    │   │   ├── index.tsx
    │   │   ├── routes.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   └── RoleRoute.tsx
    │   └── layout/
    │       ├── AuthLayout.tsx
    │       ├── HospitalLayout.tsx      # Hospital staff shell
    │       ├── MasterLayout.tsx        # Platform admin shell (was SuperAdminLayout)
    │       ├── Sidebar.tsx
    │       ├── Topbar.tsx
    │       └── ImpersonationBanner.tsx
    │
    ├── api/
    │   ├── client.ts                   # Single Axios instance → api-gateway only
    │   ├── types/
    │   │   ├── common.ts
    │   │   ├── auth.ts
    │   │   ├── master.ts               # Tenant, Subscription, Invoice (was superadmin.ts)
    │   │   ├── admin.ts
    │   │   ├── reports.ts              # NEW — analytics types
    │   │   ├── reception.ts
    │   │   ├── triage.ts
    │   │   ├── consultation.ts
    │   │   ├── laboratory.ts
    │   │   ├── radiology.ts
    │   │   ├── pharmacy.ts
    │   │   ├── billing.ts
    │   │   ├── ward.ts
    │   │   └── notifications.ts
    │   └── services/
    │       ├── auth.ts                 # → auth-service
    │       ├── master.ts               # → master-service (was superadmin.ts)
    │       ├── admin.ts                # → admin-service
    │       ├── reports.ts              # → report-service (NEW)
    │       ├── users.ts
    │       ├── reception.ts
    │       ├── triage.ts
    │       ├── consultation.ts
    │       ├── laboratory.ts
    │       ├── radiology.ts
    │       ├── pharmacy.ts
    │       ├── billing.ts
    │       ├── ward.ts
    │       └── notifications.ts
    │
    ├── features/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── master/                     # Platform admin (was superadmin/)
    │   │   ├── pages/
    │   │   │   ├── TenantManagementPage.tsx
    │   │   │   ├── SubscriptionManagementPage.tsx
    │   │   │   ├── InvoiceManagementPage.tsx
    │   │   │   └── MasterAdminsPage.tsx
    │   │   └── components/
    │   ├── admin/                      # Hospital admin
    │   ├── reports/                    # NEW — analytics dashboard
    │   ├── reception/
    │   ├── triage/
    │   ├── consultation/
    │   ├── laboratory/
    │   ├── radiology/
    │   ├── pharmacy/
    │   ├── billing/
    │   ├── ward/
    │   └── notifications/
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── usePermissions.ts
    │   └── useImpersonation.ts
    │
    ├── store/
    │   └── authStore.ts
    │
    ├── lib/
    │   ├── constants.ts                # API_BASE_URL + API_PATHS
    │   ├── roles.ts                    # Microservices role definitions
    │   └── token.ts                    # JWT decode (supports role + realm_access.roles)
    │
    ├── components/ui/
    └── styles/globals.css
```

---

## Gateway Route Map

All paths are relative to `VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`).

### auth-service
| Method | Gateway path | Frontend |
|--------|-------------|----------|
| POST | `/auth/login` | `LoginPage` |
| POST | `/auth/refresh` | `api/client.ts` (auto) |
| POST | `/auth/logout` | `Topbar` sign out |
| POST | `/auth/password-reset` | `ForgotPasswordPage` |
| POST | `/auth/mfa/setup` | MFA setup (planned) |

### master-service (super_admin only)
| Method | Gateway path | Frontend page |
|--------|-------------|---------------|
| GET/POST | `/tenants` | `/master/tenants` |
| GET | `/subscriptions` | `/master/subscriptions` |
| GET | `/invoices` | `/master/invoices` |
| GET/POST | `/master-admins` | `/master/admins` |

### admin-service (hospital_admin)
| Method | Gateway path | Frontend page |
|--------|-------------|---------------|
| GET/POST | `/users` | `/admin/users` |
| POST | `/users/{id}/deactivate` | User management |
| GET | `/departments` | Admin settings (planned) |
| GET | `/fee-schedules` | Admin settings (planned) |
| GET | `/audit-logs` | Admin audit (planned) |

### report-service (hospital_admin)
| Method | Gateway path | Frontend page |
|--------|-------------|---------------|
| GET | `/reports/patient-census` | `/reports` |
| GET | `/reports/revenue-summary` | `/reports` |
| GET | `/reports/wait-times` | `/reports` |
| GET | `/reports/bed-occupancy` | `/reports` |

### Clinical services (by role)
| Service | Gateway paths | Frontend route |
|---------|--------------|----------------|
| reception | `/patients`, `/visits`, `/queue` | `/reception/*` |
| triage | `/assessments`, `/queue` | `/triage/queue` |
| consultation | `/consultations`, `/prescriptions` | `/consultation/queue` |
| laboratory | `/requests`, `/results` | `/laboratory/requests` |
| radiology | `/reports` (imaging) | `/radiology/schedule` |
| pharmacy | `/dispense`, `/inventory` | `/pharmacy/dispense` |
| billing | `/bills`, `/payments` | `/billing` |
| ward | `/admissions`, `/beds` | `/ward/admissions` |
| notification | `/notifications` | `/notifications` |

---

## Role Reference

From `backend/microservicearchitecture.md`:

| Role | Default landing | Modules |
|------|----------------|---------|
| `super_admin` | `/master/tenants` | Tenants, subscriptions, invoices |
| `hospital_admin` | `/dashboard` | All hospital modules + reports |
| `receptionist` | `/reception/register` | Reception, queue |
| `triage_nurse` | `/triage/queue` | Triage, ward |
| `doctor` | `/consultation/queue` | Consultation, lab/radiology results |
| `lab_technician` | `/laboratory/requests` | Laboratory |
| `radiographer` | `/radiology/schedule` | Radiology |
| `pharmacist` | `/pharmacy/dispense` | Pharmacy |
| `cashier` | `/billing` | Billing |

Defined in `src/lib/roles.ts`. Sidebar nav is filtered by role automatically.

---

## Key Files Explained

### `src/api/client.ts`
Single Axios instance pointing at the API Gateway. Every request gets `Authorization: Bearer <token>`. On 401, auto-refreshes via `POST /auth/refresh`. The frontend never knows which microservice handles a request.

### `src/lib/token.ts`
Decodes JWT claims. Supports both formats during backend migration:
- **Microservices:** single `role` claim
- **Monolith/Keycloak:** `realm_access.roles` array

### `src/lib/constants.ts`
```ts
VITE_API_BASE_URL=http://localhost:8000/api/v1  // only env var needed
```

### `src/features/*/pages/`
Thin page containers. All HTTP calls go through `src/api/services/` — never call axios directly in pages.

---

## How Requests Flow

```
React component
    ↓
api/services/reception.ts  →  POST /api/v1/patients
    ↓
api/client.ts  →  Authorization: Bearer <jwt>
    ↓
API Gateway :8000  →  JWT verify, tenant resolve, rate limit
    ↓
reception-service :8010  →  tenant DB query
    ↓
Response back through gateway to React
```

RabbitMQ events (e.g. `visit.created` → billing, triage) happen **between services**. The frontend only sees the HTTP response.

---

## Development Setup

```bash
# Terminal 1 — api-gateway + services (from backend/)
docker-compose -f infrastructure/docker-compose.yml up

# Terminal 2 — frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173` — Vite proxies `/api` → `http://localhost:8000`.

---

## Conventions

1. **One gateway URL** — never add per-service env vars
2. **One service file per microservice domain** — `api/services/master.ts` maps to `master-service`
3. **Feature folders = user workflows** — not deployment units
4. **Types sync with gateway OpenAPI** — use codegen when the backend team publishes the spec
5. **Toasts at bottom** — `sonner` with `position: "bottom-center"`
6. **Plain US English** for all user-facing text

---

## What Changed from v1.0 (Monolith)

| v1.0 (monolith) | v2.0 (microservices) |
|-----------------|----------------------|
| `features/superadmin/` | `features/master/` |
| `api/services/superadmin.ts` | `api/services/master.ts` |
| `/api/v1/superadmin/tenants` | `/api/v1/tenants` |
| `/api/v1/admin/users` | `/api/v1/users` |
| `hospital_user`, `nurse`, `clinician` | `receptionist`, `triage_nurse`, etc. |
| — | `features/reports/` + `api/services/reports.ts` |
| Multiple backend concerns in one URL | Single gateway URL, same frontend structure |

---
