# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a full-stack Inventory Management Dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Inventory Management Dashboard

- **Frontend**: React + Vite at `/` (artifacts/inventory-dashboard)
- **Backend**: Express API server at `/api` (artifacts/api-server)
- **Charts**: Recharts (AreaChart, BarChart, PieChart/Donut)
- **Animations**: Framer Motion for staggered entrance animations

### Features
- Dashboard KPI cards: Total Sales, Total Purchases, Net Profit, Receivable, Payable
- 4 charts: Sales Trend (Area), Top 10 Customers (Horizontal Bar), Sales by Category (Pie), Purchases by Location (Donut)
- Low stock alerts table
- Full CRUD for: Inventory, Sales, Purchases, Customers, Suppliers
- Settings page

### Pages & Routes
- `/` — Dashboard overview with KPIs and charts
- `/inventory` — Inventory items management
- `/sales` — Sales records management
- `/purchases` — Purchase records management
- `/customers` — Customer management
- `/suppliers` — Supplier management
- `/settings` — Application settings

### Database Tables
- `inventory_items` — Products with SKU, category, quantity, pricing
- `customers` — Customer contacts with running totals
- `suppliers` — Supplier contacts with running totals
- `sales` — Sale transactions referencing customers and inventory
- `purchases` — Purchase transactions referencing suppliers and inventory

### API Endpoints
- `GET/POST /api/inventory`, `GET/PUT/DELETE /api/inventory/:id`
- `GET/POST /api/sales`, `GET/PUT/DELETE /api/sales/:id`
- `GET/POST /api/purchases`, `GET/PUT/DELETE /api/purchases/:id`
- `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/:id`
- `GET/POST /api/suppliers`, `GET/PUT/DELETE /api/suppliers/:id`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/sales-trend`
- `GET /api/dashboard/top-customers`
- `GET /api/dashboard/sales-by-category`
- `GET /api/dashboard/purchases-by-location`
- `GET /api/dashboard/low-stock`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
