import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import db from "../database/index.js";
import { metadata, orders, files } from "../database/schema.js";
import { eq } from "drizzle-orm";
import { razorpay } from "../services/razorpay.js";
import { OAuth2Client } from "google-auth-library";
import { orderChannel } from "../channels/orderChannel.js";
import { authMiddleware } from "../middlewares/auth.js";

const app = new Hono();
const client = new OAuth2Client();

app.post(
  "/upload",
  authMiddleware,
  zValidator(
    "json",
    z.array(
      z.object({
        // need to add 3 more fields - numberUp, sides, pageRanges
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
      // for now O(1)
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

    const response = await razorpay.orders.create({
      amount: "100",
      currency: "INR",
      receipt: "payment for print #1",
    });

    const datax = {
      file: "test/edith.pdf",
      orientation: "3",
      color: "Monochrome",
      copies: "1", // 9999 max hota hai
      paperFormat: "iso_a4_210x297mm",
    };

    orderChannel.broadcast(JSON.stringify(datax), "update");

    return c.json({ data, response });
  },
);

export default app;
