import { pgTable, serial, integer, numeric, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { suppliers } from "./suppliers";
import { inventoryItems } from "./inventory";

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  purchaseDate: date("purchase_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, createdAt: true, totalCost: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;
