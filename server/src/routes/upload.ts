import { Hono } from "hono";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../services/s3.js";
import db from "../database/index.js";
import { metadata } from "../database/schema.js";
import { extractMetadataAndPages } from "pdf-metadata";
import { authMiddleware } from "../middlewares/auth.js";

const app = new Hono();

app.post("/upload", authMiddleware, async (c) => {
  const { file } = await c.req.parseBody();

  if (!(file instanceof File)) return c.text("invalid file type", 200);
  if (file.type != "application/pdf") return c.text("only pdf support", 200);
  if (file.size > 10 * 1024 * 1024) return c.text("10mb limit", 200);

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const filename = `${crypto.randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET,
    Key: filename,
    Body: uint8Array,
    ContentType: file.type,
    ContentLength: uint8Array.length,
  });

  const result = await s3Client.send(command);

  if (result.$metadata.httpStatusCode != 200)
    return c.json({ message: "failed" }, 500);

  await db.insert(metadata).values({
    file: filename,
    pages: (await extractMetadataAndPages(arrayBuffer)).pages,
  });

  return c.json({ file: filename });
});

export default app;