import { Router, type IRouter } from "express";
import { eq, gte, lte, and } from "drizzle-orm";
import { db, sales, customers, inventoryItems } from "@workspace/db";
import {
  ListSalesQueryParams,
  CreateSaleBody,
  GetSaleParams,
  GetSaleResponse,
  UpdateSaleParams,
  UpdateSaleBody,
  UpdateSaleResponse,
  DeleteSaleParams,
  ListSalesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const formatSale = (row: {
  id: number;
  customerId: number;
  inventoryItemId: number;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  paymentStatus: string;
  saleDate: string;
  createdAt: Date;
  customerName: string;
  itemName: string;
  category: string;
}) => ({
  ...row,
  unitPrice: parseFloat(row.unitPrice),
  totalAmount: parseFloat(row.totalAmount),
  createdAt: row.createdAt.toISOString(),
});

router.get("/sales", async (req, res): Promise<void> => {
  const query = ListSalesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.customerId) conditions.push(eq(sales.customerId, query.data.customerId));
  if (query.data.dateFrom) conditions.push(gte(sales.saleDate, query.data.dateFrom));
  if (query.data.dateTo) conditions.push(lte(sales.saleDate, query.data.dateTo));

  const rows = await db
    .select({
      id: sales.id,
      customerId: sales.customerId,
      inventoryItemId: sales.inventoryItemId,
      quantity: sales.quantity,
      unitPrice: sales.unitPrice,
      totalAmount: sales.totalAmount,
      paymentStatus: sales.paymentStatus,
      saleDate: sales.saleDate,
      createdAt: sales.createdAt,
      customerName: customers.name,
      itemName: inventoryItems.name,
      category: inventoryItems.category,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(inventoryItems, eq(sales.inventoryItemId, inventoryItems.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sales.createdAt);

  const formatted = rows.map((r) => formatSale({
    ...r,
    customerName: r.customerName ?? "Unknown",
    itemName: r.itemName ?? "Unknown",
    category: r.category ?? "Unknown",
  }));

  res.json(ListSalesResponse.parse(formatted));
});

router.post("/sales", async (req, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const totalAmount = parsed.data.quantity * parsed.data.unitPrice;

  const [sale] = await db.insert(sales).values({
    customerId: parsed.data.customerId,
    inventoryItemId: parsed.data.inventoryItemId,
    quantity: parsed.data.quantity,
    unitPrice: String(parsed.data.unitPrice),
    totalAmount: String(totalAmount),
    paymentStatus: parsed.data.paymentStatus,
    saleDate: parsed.data.saleDate,
  }).returning();

  // Update inventory quantity
  await db
    .update(inventoryItems)
    .set({ quantity: db.$count(inventoryItems) })
    .where(eq(inventoryItems.id, parsed.data.inventoryItemId));

  // Update customer total purchases
  const [cust] = await db.select().from(customers).where(eq(customers.id, parsed.data.customerId));
  if (cust) {
    const newTotal = parseFloat(cust.totalPurchases) + totalAmount;
    await db.update(customers).set({ totalPurchases: String(newTotal) }).where(eq(customers.id, parsed.data.customerId));
  }

  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, sale.inventoryItemId));
  const [customer] = await db.select().from(customers).where(eq(customers.id, sale.customerId));

  res.status(201).json(GetSaleResponse.parse(formatSale({
    ...sale,
    customerName: customer?.name ?? "Unknown",
    itemName: item?.name ?? "Unknown",
    category: item?.category ?? "Unknown",
  })));
});

router.get("/sales/:id", async (req, res): Promise<void> => {
  const params = GetSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: sales.id,
      customerId: sales.customerId,
      inventoryItemId: sales.inventoryItemId,
      quantity: sales.quantity,
      unitPrice: sales.unitPrice,
      totalAmount: sales.totalAmount,
      paymentStatus: sales.paymentStatus,
      saleDate: sales.saleDate,
      createdAt: sales.createdAt,
      customerName: customers.name,
      itemName: inventoryItems.name,
      category: inventoryItems.category,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(inventoryItems, eq(sales.inventoryItemId, inventoryItems.id))
    .where(eq(sales.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  res.json(GetSaleResponse.parse(formatSale({
    ...row,
    customerName: row.customerName ?? "Unknown",
    itemName: row.itemName ?? "Unknown",
    category: row.category ?? "Unknown",
  })));
});

router.put("/sales/:id", async (req, res): Promise<void> => {
  const params = UpdateSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const totalAmount = parsed.data.quantity * parsed.data.unitPrice;

  const [sale] = await db.update(sales)
    .set({
      customerId: parsed.data.customerId,
      inventoryItemId: parsed.data.inventoryItemId,
      quantity: parsed.data.quantity,
      unitPrice: String(parsed.data.unitPrice),
      totalAmount: String(totalAmount),
      paymentStatus: parsed.data.paymentStatus,
      saleDate: parsed.data.saleDate,
    })
    .where(eq(sales.id, params.data.id))
    .returning();

  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, sale.inventoryItemId));
  const [customer] = await db.select().from(customers).where(eq(customers.id, sale.customerId));

  res.json(UpdateSaleResponse.parse(formatSale({
    ...sale,
    customerName: customer?.name ?? "Unknown",
    itemName: item?.name ?? "Unknown",
    category: item?.category ?? "Unknown",
  })));
});

router.delete("/sales/:id", async (req, res): Promise<void> => {
  const params = DeleteSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sale] = await db.delete(sales).where(eq(sales.id, params.data.id)).returning();
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
