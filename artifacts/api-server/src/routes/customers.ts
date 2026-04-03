import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, customers } from "@workspace/db";
import {
  ListCustomersQueryParams,
  CreateCustomerBody,
  GetCustomerParams,
  GetCustomerResponse,
  UpdateCustomerParams,
  UpdateCustomerBody,
  UpdateCustomerResponse,
  DeleteCustomerParams,
  ListCustomersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const formatCustomer = (c: typeof customers.$inferSelect) => ({
  ...c,
  totalPurchases: parseFloat(c.totalPurchases),
  createdAt: c.createdAt.toISOString(),
});

router.get("/customers", async (req, res): Promise<void> => {
  const query = ListCustomersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(customers).$dynamic();

  if (query.data.search) {
    dbQuery = dbQuery.where(
      sql`(${customers.name} ILIKE ${"%" + query.data.search + "%"} OR ${customers.email} ILIKE ${"%" + query.data.search + "%"})`
    );
  }

  const rows = await dbQuery.orderBy(customers.createdAt);
  res.json(ListCustomersResponse.parse(rows.map(formatCustomer)));
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [c] = await db.insert(customers).values(parsed.data).returning();
  res.status(201).json(GetCustomerResponse.parse(formatCustomer(c)));
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [c] = await db.select().from(customers).where(eq(customers.id, params.data.id));
  if (!c) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(GetCustomerResponse.parse(formatCustomer(c)));
});

router.put("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [c] = await db.update(customers).set(parsed.data).where(eq(customers.id, params.data.id)).returning();
  if (!c) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(UpdateCustomerResponse.parse(formatCustomer(c)));
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [c] = await db.delete(customers).where(eq(customers.id, params.data.id)).returning();
  if (!c) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
