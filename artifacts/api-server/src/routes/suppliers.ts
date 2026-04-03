import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, suppliers } from "@workspace/db";
import {
  ListSuppliersQueryParams,
  CreateSupplierBody,
  GetSupplierParams,
  GetSupplierResponse,
  UpdateSupplierParams,
  UpdateSupplierBody,
  UpdateSupplierResponse,
  DeleteSupplierParams,
  ListSuppliersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const formatSupplier = (s: typeof suppliers.$inferSelect) => ({
  ...s,
  totalSupplied: parseFloat(s.totalSupplied),
  createdAt: s.createdAt.toISOString(),
});

router.get("/suppliers", async (req, res): Promise<void> => {
  const query = ListSuppliersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(suppliers).$dynamic();

  if (query.data.search) {
    dbQuery = dbQuery.where(
      sql`(${suppliers.name} ILIKE ${"%" + query.data.search + "%"} OR ${suppliers.email} ILIKE ${"%" + query.data.search + "%"})`
    );
  }

  const rows = await dbQuery.orderBy(suppliers.createdAt);
  res.json(ListSuppliersResponse.parse(rows.map(formatSupplier)));
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [s] = await db.insert(suppliers).values(parsed.data).returning();
  res.status(201).json(GetSupplierResponse.parse(formatSupplier(s)));
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const params = GetSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [s] = await db.select().from(suppliers).where(eq(suppliers.id, params.data.id));
  if (!s) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.json(GetSupplierResponse.parse(formatSupplier(s)));
});

router.put("/suppliers/:id", async (req, res): Promise<void> => {
  const params = UpdateSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [s] = await db.update(suppliers).set(parsed.data).where(eq(suppliers.id, params.data.id)).returning();
  if (!s) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.json(UpdateSupplierResponse.parse(formatSupplier(s)));
});

router.delete("/suppliers/:id", async (req, res): Promise<void> => {
  const params = DeleteSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [s] = await db.delete(suppliers).where(eq(suppliers.id, params.data.id)).returning();
  if (!s) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
