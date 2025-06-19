import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  email: text("email").primaryKey().notNull(),
  name: text("name").notNull(),
});

export const orders = sqliteTable("orders", {
  order_id: text("order_id").primaryKey().notNull(),
  user_id: text("user_id").notNull(),
  order_status: text("order_status", {
    enum: ["pending", "processing", "cancelled", "completed"],
  })
    .notNull()
    .default("pending"),
  order_cost: real("order_cost").notNull(),
  orientation: text("orientation", {
    enum: ["landscape", "portrait"],
  })
    .notNull()
    .default("portrait"),
  format: text("format", { enum: ["color", "bw"] })
    .notNull()
    .default("bw"),
  no_of_copies: integer("no_of_copies").notNull().default(1),
  paper_format: text("paper_format", { enum: ["a4", "a3"] })
    .notNull()
    .default("a4"),
  pages_to_print: text("pages_to_print").notNull(), // check in server
  pages_per_sheet: integer("pages_per_sheet").notNull().default(1),
  created_at: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updated_at: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  file_uri: text("file_uri").notNull(),
});
