// import { zValidator } from "@hono/zod-validator";
// import { Hono } from "hono";
// import { z } from "zod";
// import db from "../database/index.js";
// import { metadata } from "../database/schema.js";
// import { eq } from "drizzle-orm";
// import { razorpay } from "../services/razorpay.js";
// import { orderChannel } from "../channels/orderChannel.js";
// import { authMiddleware } from "../middlewares/auth.js";

// const app = new Hono();

// app.post(
//   "/create",
//   authMiddleware,
//   zValidator(
//     "json",
//     z.array(
//       z.object({
//         isLandscape: z.boolean().default(false),
//         isColor: z.boolean().default(false),
//         copies: z.number().default(1),
//         file: z.string().uuid(),
//         numberUp: z.number().default(1),
//         sides: z.string(),
//         pageRanges: z.string(),
//         orderName: z.string(),
//         name: z.string(),
//         paperFormat: z
//           .string()
//           .default("a4")
//           .refine((value) => value === "a3" || value === "a4"),
//       }),
//     ),
//   ),
//   async (c) => {
//     const configs = c.req.valid("json");
//     const data = [];
//     const user = c.get('payload')

//     for (const config of configs) {
//       const metadataResponse = await db.query.metadata.findFirst({
//         where: eq(metadata.file, config.file),
//         columns: { pages: true },
//       });

//       if (!metadataResponse) return c.json({ message: "file not found" });

//       data.push({ pages: metadataResponse.pages, ...config });
//     }

//     const response = await razorpay.orders.create({
//       amount: "100",
//       currency: "INR",
//       receipt: "payment for print #1",
//     });

//     const datax = {
//       file: "test/edith.pdf",
//       orientation: "3",
//       color: "Monochrome",
//       copies: "1",
//       paperFormat: "iso_a4_210x297mm",
//     };

//     orderChannel.broadcast(JSON.stringify(datax), "update");

//     return c.json({ data, response });
//   },
// );

// export default app;


import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import db from "../database/index.js";
import { metadata, orders, files } from "../database/schema.js";
import { eq } from "drizzle-orm";
import { razorpay } from "../services/razorpay.js";
import { authMiddleware } from "../middlewares/auth.js";

const app = new Hono();

// Helper function to calculate pages from page ranges
function calculatePages(pageRanges : string) {
  const ranges = pageRanges.split(',').map(range => range.trim());
  const pages = new Set();

  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(num => parseInt(num.trim()));
      for (let i = start; i <= end; i++) {
        pages.add(i);
      }
    } else {
      pages.add(parseInt(range.trim()));
    }
  }

  return pages.size;
}

// Helper function to calculate cost per page based on sides
function calculateCostPerPage(sides : string) {
  return sides.toLowerCase() === 'single' ? 2 : 4; // 2rs for single sided, 4rs for double sided
}

app.post(
  "/create",
  authMiddleware,
  zValidator(
    "json",
    z.array(
      z.object({
        isLandscape: z.boolean().default(false),
        isColor: z.boolean().default(false),
        copies: z.number().default(1),
        file: z.string().uuid(),
        numberUp: z.number().default(1),
        sides: z.string(),
        pageRanges: z.string(),
        orderName: z.string(),
        name: z.string(),
        paperFormat: z
          .string()
          .default("a4")
          .refine((value) => value === "a3" || value === "a4"),
      }),
    ),
  ),
  async (c) => {
    const configs = c.req.valid("json");
    const data = [];
    let totalAmount = 0;

    // Validate files exist and calculate total amount
    for (const config of configs) {
      const metadataResponse = await db.query.metadata.findFirst({
        where: eq(metadata.file, config.file),
        columns: { pages: true },
      });

      if (!metadataResponse) {
        return c.json({ message: `File ${config.file} not found` }, 404);
      }

      const pagesInRange = calculatePages(config.pageRanges);
      const costPerPage = calculateCostPerPage(config.sides);
      const fileCost = pagesInRange * costPerPage * config.copies;

      totalAmount += fileCost;

      data.push({
        pages: metadataResponse.pages,
        calculatedPages: pagesInRange,
        cost: fileCost,
        ...config
      });
    }

    // Create Razorpay order
    const razorpayResponse = await razorpay.orders.create({
      amount: (totalAmount * 100).toString(), // Razorpay expects amount in paise
      currency: "INR",
      receipt: `payment for print order`,
    });


      await db.insert(orders).values({
        id: razorpayResponse.id,
        name: configs[0].orderName || configs[0].name, 
        user: c.get('payload').email!, 
        amount: totalAmount,
        paid: false,
        status: "pending",
      });

    // Insert into files table
    const fileRecords = configs.map((config) => ({
      id: config.file, // Using file UUID as ID
      order: razorpayResponse.id,
      orientation: config.isLandscape ? "3" : "4",
      color: config.isColor ? "color" : "monochrome",
      copies: config.copies.toString(),
      paperFormat: config.paperFormat === "a3" ? "iso_a3_297x420mm" : "iso_a4_210x297mm",
      file: config.file,
      pageRanges: "1,2,3,4",
      numberUp: "1234",
      sides: "1234",
    }));

    await db.insert(files).values(fileRecords);

    return c.json({
      message: "Order created successfully",
      orderId: razorpayResponse.id,
      totalAmount,
      data,
      razorpayResponse
    });
  },
);

export default app;