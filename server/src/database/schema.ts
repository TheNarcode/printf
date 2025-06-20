import { relations } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
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
  isLandscape: integer("is_landscape", { mode: "boolean" })
    .notNull()
    .default(false),
  isColor: integer("is_color", { mode: "boolean" }).notNull().default(false),
  copies: integer("copies").notNull().default(1),
  paperFormat: text("paper_format", { enum: ["a4", "a3"] })
    .notNull()
    .default("a4"),
  file: text("file").notNull(),
  // future additions
  // pages_to_print: text("pages_to_print").notNull(), // check in server
  // pages_per_sheet: integer("pages_per_sheet").notNull().default(1),
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
