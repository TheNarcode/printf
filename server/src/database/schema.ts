import { relations } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  user: text("user").notNull(),
  amount: real("amount").notNull(),
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  status: text("status", {
    enum: ["pending", "processing", "cancelled", "completed"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  order: text("order").notNull(),
  orientation: text("orientation").notNull(),
  color: text("color").notNull(),
  copies: text("copies").notNull(),
  paperFormat: text("paper_format").notNull(),
  file: text("file").notNull(),
  pageRanges: text("page_ranges").notNull(),
  numberUp: text("number_up").notNull(),
});

export const metadata = sqliteTable("metadata", {
  file: text("id").primaryKey(),
  pages: integer("pages").notNull(),
});

export const usersRelation = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.user],
    references: [users.email],
  }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  order: one(orders, {
    fields: [files.order],
    references: [orders.id],
  }),
}));
