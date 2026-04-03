import { Router, type IRouter } from "express";
import { eq, gte, sql, lte } from "drizzle-orm";
import { db, sales, purchases, customers, suppliers, inventoryItems } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetSalesTrendResponse,
  GetTopCustomersResponse,
  GetSalesByCategoryResponse,
  GetPurchasesByLocationResponse,
  GetLowStockItemsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  // Total sales (paid)
  const [salesResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)` })
    .from(sales);
  const totalSales = parseFloat(salesResult?.total ?? "0");

  // Total purchases
  const [purchasesResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${purchases.totalCost}), 0)` })
    .from(purchases);
  const totalPurchases = parseFloat(purchasesResult?.total ?? "0");

  // Receivable = unpaid/pending sales
  const [receivableResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)` })
    .from(sales)
    .where(eq(sales.paymentStatus, "pending"));
  const totalReceivable = parseFloat(receivableResult?.total ?? "0");

  // Payable = unpaid/pending purchases
  const [payableResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${purchases.totalCost}), 0)` })
    .from(purchases)
    .where(eq(purchases.paymentStatus, "pending"));
  const totalPayable = parseFloat(payableResult?.total ?? "0");

  // Inventory stats
  const [invCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(inventoryItems);
  const totalInventoryItems = Number(invCount?.count ?? 0);

  const lowStockItems = await db
    .select()
    .from(inventoryItems)
    .where(sql`${inventoryItems.quantity} <= ${inventoryItems.reorderLevel}`);
  const lowStockCount = lowStockItems.length;

  const netProfit = totalSales - totalPurchases;

  res.json(GetDashboardSummaryResponse.parse({
    totalSales,
    totalPurchases,
    netProfit,
    totalReceivable,
    totalPayable,
    totalInventoryItems,
    lowStockCount,
  }));
});

router.get("/dashboard/sales-trend", async (_req, res): Promise<void> => {
  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

  const salesData = await db
    .select({
      date: sales.saleDate,
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
    .from(sales)
    .where(gte(sales.saleDate, dateStr))
    .groupBy(sales.saleDate)
    .orderBy(sales.saleDate);

  const purchasesData = await db
    .select({
      date: purchases.purchaseDate,
      total: sql<string>`COALESCE(SUM(${purchases.totalCost}), 0)`,
    })
    .from(purchases)
    .where(gte(purchases.purchaseDate, dateStr))
    .groupBy(purchases.purchaseDate)
    .orderBy(purchases.purchaseDate);

  // Merge by date
  const dateMap: Record<string, { date: string; sales: number; purchases: number }> = {};

  for (const s of salesData) {
    if (!dateMap[s.date]) dateMap[s.date] = { date: s.date, sales: 0, purchases: 0 };
    dateMap[s.date].sales = parseFloat(s.total);
  }
  for (const p of purchasesData) {
    if (!dateMap[p.date]) dateMap[p.date] = { date: p.date, sales: 0, purchases: 0 };
    dateMap[p.date].purchases = parseFloat(p.total);
  }

  const trend = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  res.json(GetSalesTrendResponse.parse(trend));
});

router.get("/dashboard/top-customers", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      totalAmount: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
    .from(customers)
    .leftJoin(sales, eq(sales.customerId, customers.id))
    .groupBy(customers.id, customers.name)
    .orderBy(sql`SUM(${sales.totalAmount}) DESC NULLS LAST`)
    .limit(10);

  res.json(GetTopCustomersResponse.parse(rows.map((r) => ({
    customerId: r.customerId,
    customerName: r.customerName,
    totalAmount: parseFloat(r.totalAmount),
  }))));
});

router.get("/dashboard/sales-by-category", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: inventoryItems.category,
      totalAmount: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      count: sql<number>`COUNT(${sales.id})`,
    })
    .from(sales)
    .leftJoin(inventoryItems, eq(sales.inventoryItemId, inventoryItems.id))
    .groupBy(inventoryItems.category)
    .orderBy(sql`SUM(${sales.totalAmount}) DESC`);

  res.json(GetSalesByCategoryResponse.parse(rows.map((r) => ({
    category: r.category ?? "Unknown",
    totalAmount: parseFloat(r.totalAmount),
    count: Number(r.count),
  }))));
});

router.get("/dashboard/purchases-by-location", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      location: suppliers.country,
      totalAmount: sql<string>`COALESCE(SUM(${purchases.totalCost}), 0)`,
      count: sql<number>`COUNT(${purchases.id})`,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .groupBy(suppliers.country)
    .orderBy(sql`SUM(${purchases.totalCost}) DESC`);

  res.json(GetPurchasesByLocationResponse.parse(rows.map((r) => ({
    location: r.location ?? "Unknown",
    totalAmount: parseFloat(r.totalAmount),
    count: Number(r.count),
  }))));
});

router.get("/dashboard/low-stock", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(inventoryItems)
    .where(sql`${inventoryItems.quantity} <= ${inventoryItems.reorderLevel}`)
    .orderBy(inventoryItems.quantity);

  const formatted = items.map((item) => ({
    ...item,
    unitPrice: parseFloat(item.unitPrice),
    costPrice: parseFloat(item.costPrice),
    createdAt: item.createdAt.toISOString(),
  }));

  res.json(GetLowStockItemsResponse.parse(formatted));
});

export default router;
