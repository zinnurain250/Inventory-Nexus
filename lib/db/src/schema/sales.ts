import { pgTable, serial, integer, numeric, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customers } from "./customers";
import { inventoryItems } from "./inventory";

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  saleDate: date("sale_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true, totalAmount: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;
