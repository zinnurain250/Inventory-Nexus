# Inventory Nexus

This repo is now set up around a **pragmatic mixed mode** deployment:

- **Inventory page** talks **directly to a Google Apps Script Web App backed by Google Sheets**.
- **Dashboard / Sales / Purchases / Customers / Suppliers** still use the existing Express + Postgres backend.

That keeps the most important flow usable right now without requiring Google Cloud service accounts.

## What changed in this pass

- Replaced the hardcoded inventory data source with a small frontend adapter in `artifacts/inventory-dashboard/src/lib/apps-script-inventory.ts`.
- Inventory now reads its Apps Script URL from `VITE_INVENTORY_APPS_SCRIPT_URL`.
- Kept a default fallback to the currently working Apps Script URL so the inventory page still works immediately.
- Added better inventory UX for:
  - loading state
  - manual refresh
  - clearer Apps Script error messages
  - visible config warning when the URL is missing
- Updated `.env.example` for Apps Script-based inventory deployment.
- Rewrote this README around the actual current architecture instead of the older Google Cloud / service-account approach.

## Current architecture decision

I did **not** fully switch the whole site to Apps Script in one pass.

Instead, I introduced a **small adapter layer only for inventory** because that is the fastest way to get a coherent, deployable result without breaking the rest of the app:

- inventory is already wired to Apps Script and is the only confirmed working web app endpoint
- the other pages still depend on generated API hooks and legacy backend routes
- forcing a full Apps Script rewrite for every entity in one pass would be riskier and likely leave the site half-broken

So the deploy story is now honest and usable:

- **want inventory working now?** Deploy the frontend and set the Apps Script URL
- **want the whole suite working?** Also deploy the legacy API + Postgres, or continue the Apps Script migration later

## What works now

### Inventory page

The `/inventory` page is the working part of the app right now.

It supports:

- list inventory items
- search inventory items
- filter by category
- create inventory item
- edit inventory item
- delete inventory item
- low-stock status badges
- polling refresh plus manual refresh button

Inventory talks directly to this Apps Script endpoint by default:

```text
https://script.google.com/macros/s/AKfycbzd4At0brYUEutIj7Ae8cLTmsx5OnFqg4cnfWftNRQWGxdbkSCFwFyiwKdzstx8GxjrNQ/exec
