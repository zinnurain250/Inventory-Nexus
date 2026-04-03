import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, purchases, suppliers, inventoryItems } from "@workspace/db";
import {
  ListPurchasesQueryParams,
  CreatePurchaseBody,
  GetPurchaseParams,
  GetPurchaseResponse,
  UpdatePurchaseParams,
  UpdatePurchaseBody,
  UpdatePurchaseResponse,
  DeletePurchaseParams,
  ListPurchasesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const formatPurchase = (row: {
  id: number;
  supplierId: number;
  inventoryItemId: number;
  quantity: number;
  unitCost: string;
  totalCost: string;
  paymentStatus: string;
  purchaseDate: string;
  createdAt: Date;
  supplierName: string;
  itemName: string;
}) => ({
  ...row,
  unitCost: parseFloat(row.unitCost),
  totalCost: parseFloat(row.totalCost),
  createdAt: row.createdAt.toISOString(),
});

router.get("/purchases", async (req, res): Promise<void> => {
  const query = ListPurchasesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db
    .select({
      id: purchases.id,
      supplierId: purchases.supplierId,
      inventoryItemId: purchases.inventoryItemId,
      quantity: purchases.quantity,
      unitCost: purchases.unitCost,
      totalCost: purchases.totalCost,
      paymentStatus: purchases.paymentStatus,
      purchaseDate: purchases.purchaseDate,
      createdAt: purchases.createdAt,
      supplierName: suppliers.name,
      itemName: inventoryItems.name,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(inventoryItems, eq(purchases.inventoryItemId, inventoryItems.id))
    .$dynamic();

  if (query.data.supplierId) {
    dbQuery = dbQuery.where(eq(purchases.supplierId, query.data.supplierId));
  }

  const rows = await dbQuery.orderBy(purchases.createdAt);
  res.json(ListPurchasesResponse.parse(rows.map((r) => formatPurchase({
    ...r,
    supplierName: r.supplierName ?? "Unknown",
    itemName: r.itemName ?? "Unknown",
  }))));
});

router.post("/purchases", async (req, res): Promise<void> => {
  const parsed = CreatePurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const totalCost = parsed.data.quantity * parsed.data.unitCost;

  const [purchase] = await db.insert(purchases).values({
    supplierId: parsed.data.supplierId,
    inventoryItemId: parsed.data.inventoryItemId,
    quantity: parsed.data.quantity,
    unitCost: String(parsed.data.unitCost),
    totalCost: String(totalCost),
    paymentStatus: parsed.data.paymentStatus,
    purchaseDate: parsed.data.purchaseDate,
  }).returning();

  // Update supplier total
  const [sup] = await db.select().from(suppliers).where(eq(suppliers.id, parsed.data.supplierId));
  if (sup) {
    const newTotal = parseFloat(sup.totalSupplied) + totalCost;
    await db.update(suppliers).set({ totalSupplied: String(newTotal) }).where(eq(suppliers.id, parsed.data.supplierId));
  }

  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, purchase.inventoryItemId));
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, purchase.supplierId));

  res.status(201).json(GetPurchaseResponse.parse(formatPurchase({
    ...purchase,
    supplierName: supplier?.name ?? "Unknown",
    itemName: item?.name ?? "Unknown",
  })));
});

router.get("/purchases/:id", async (req, res): Promise<void> => {
  const params = GetPurchaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: purchases.id,
      supplierId: purchases.supplierId,
      inventoryItemId: purchases.inventoryItemId,
      quantity: purchases.quantity,
      unitCost: purchases.unitCost,
      totalCost: purchases.totalCost,
      paymentStatus: purchases.paymentStatus,
      purchaseDate: purchases.purchaseDate,
      createdAt: purchases.createdAt,
      supplierName: suppliers.name,
      itemName: inventoryItems.name,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(inventoryItems, eq(purchases.inventoryItemId, inventoryItems.id))
    .where(eq(purchases.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  res.json(GetPurchaseResponse.parse(formatPurchase({
    ...row,
    supplierName: row.supplierName ?? "Unknown",
    itemName: row.itemName ?? "Unknown",
  })));
});

router.put("/purchases/:id", async (req, res): Promise<void> => {
  const params = UpdatePurchaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const totalCost = parsed.data.quantity * parsed.data.unitCost;

  const [purchase] = await db.update(purchases)
    .set({
      supplierId: parsed.data.supplierId,
      inventoryItemId: parsed.data.inventoryItemId,
      quantity: parsed.data.quantity,
      unitCost: String(parsed.data.unitCost),
      totalCost: String(totalCost),
      paymentStatus: parsed.data.paymentStatus,
      purchaseDate: parsed.data.purchaseDate,
    })
    .where(eq(purchases.id, params.data.id))
    .returning();

  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, purchase.inventoryItemId));
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, purchase.supplierId));

  res.json(UpdatePurchaseResponse.parse(formatPurchase({
    ...purchase,
    supplierName: supplier?.name ?? "Unknown",
    itemName: item?.name ?? "Unknown",
  })));
});

router.delete("/purchases/:id", async (req, res): Promise<void> => {
  const params = DeletePurchaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [purchase] = await db.delete(purchases).where(eq(purchases.id, params.data.id)).returning();
  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
