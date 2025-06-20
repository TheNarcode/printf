import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import db from "../database/index.js";
import { metadata, orders, files } from "../database/schema.js";
import { eq } from "drizzle-orm";

const app = new Hono();

app.post(
  "/upload",
  zValidator(
    "json",
    z.array(
      z.object({
        isLandscape: z.boolean().default(false),
        isColor: z.boolean().default(false),
        copies: z.number().default(1),
        file: z.string().uuid(),
        paperFormat: z
          .string()
          .default("a4")
          .refine((value) => value === "a3" || value === "a4"),
      }),
    ),
  ),
  async (c) => {
    const configs = c.req.valid("json");
    const data = []; // files data

    for (const config of configs) {
      const metadataResponse = await db.query.metadata.findFirst({
        where: eq(metadata.file, config.file),
        columns: { pages: true },
      });

      if (!metadataResponse) return c.json({ message: "file not found" });

      data.push({ pages: metadataResponse.pages, ...config });
    }

    // todo:
    // user id matlab email
    // insert into orders with user id and get order id
    // await db.insert(orders).values({});

    // insert with order id and user id in files
    // await db.insert(files).values({ });
    
    

    return c.text("ok");
  },
);

export default app;
