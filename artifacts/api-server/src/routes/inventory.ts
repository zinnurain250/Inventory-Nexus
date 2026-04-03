import { Router, type IRouter } from "express";
import { eq, like, sql } from "drizzle-orm";
import { db, inventoryItems } from "@workspace/db";
import {
  ListInventoryQueryParams,
  CreateInventoryItemBody,
  GetInventoryItemParams,
  GetInventoryItemResponse,
  UpdateInventoryItemParams,
  UpdateInventoryItemBody,
  UpdateInventoryItemResponse,
  DeleteInventoryItemParams,
  ListInventoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inventory", async (req, res): Promise<void> => {
  const query = ListInventoryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(inventoryItems).$dynamic();

  if (query.data.category) {
    dbQuery = dbQuery.where(eq(inventoryItems.category, query.data.category));
  }
  if (query.data.search) {
    dbQuery = dbQuery.where(
      sql`(${inventoryItems.name} ILIKE ${"%" + query.data.search + "%"} OR ${inventoryItems.sku} ILIKE ${"%" + query.data.search + "%"})`
    );
  }

  const items = await dbQuery.orderBy(inventoryItems.createdAt);
  const formatted = items.map((item) => ({
    ...item,
    unitPrice: parseFloat(item.unitPrice),
    costPrice: parseFloat(item.costPrice),
    createdAt: item.createdAt.toISOString(),
  }));
  res.json(ListInventoryResponse.parse(formatted));
});

router.post("/inventory", async (req, res): Promise<void> => {
  const parsed = CreateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.insert(inventoryItems).values({
    ...parsed.data,
    unitPrice: String(parsed.data.unitPrice),
    costPrice: String(parsed.data.costPrice),
  }).returning();

  res.status(201).json(GetInventoryItemResponse.parse({
    ...item,
    unitPrice: parseFloat(item.unitPrice),
    costPrice: parseFloat(item.costPrice),
    createdAt: item.createdAt.toISOString(),
  }));
});

router.get("/inventory/:id", async (req, res): Promise<void> => {
  const params = GetInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  res.json(GetInventoryItemResponse.parse({
    ...item,
    unitPrice: parseFloat(item.unitPrice),
    costPrice: parseFloat(item.costPrice),
    createdAt: item.createdAt.toISOString(),
  }));
});

router.put("/inventory/:id", async (req, res): Promise<void> => {
  const params = UpdateInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.update(inventoryItems)
    .set({
      ...parsed.data,
      unitPrice: String(parsed.data.unitPrice),
      costPrice: String(parsed.data.costPrice),
    })
    .where(eq(inventoryItems.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  res.json(UpdateInventoryItemResponse.parse({
    ...item,
    unitPrice: parseFloat(item.unitPrice),
    costPrice: parseFloat(item.costPrice),
    createdAt: item.createdAt.toISOString(),
  }));
});

router.delete("/inventory/:id", async (req, res): Promise<void> => {
  const params = DeleteInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.delete(inventoryItems).where(eq(inventoryItems.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
