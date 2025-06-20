import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  },
  schema,
});

export default db;
