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

  // 1. Single file existence and type validation
    if (!file || !(file instanceof File)) {
      return c.text("no file provided", 400);
    }

    //2.  Single MIME type validation
    if (file.type !== "application/pdf") {
      return c.text("only pdf support", 400);
    }

    //3. File size validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size === 0) {
      return c.text("empty file not allowed", 400);
    }
    if (file.size > maxSize) {
      return c.text("10mb limit", 400);
    }

    //4. Filename validation
    if (!file.name || file.name.trim() === "") {
      return c.text("filename required", 400);
    }
    if (file.name.length > 255) {
      return c.text("filename too long", 400);
    }

    //5. File extension validation
    const allowedExtensions = ['.pdf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return c.text("invalid file extension", 400);
    }

    //6. Suspicious filename patterns
    const suspiciousPatterns = /[<>:"|?*\x00-\x1f]/;
    if (suspiciousPatterns.test(file.name)) {
      return c.text("invalid filename characters", 400);
    }

    //7. Get array buffer once
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    //8. PDF magic bytes validation
    const pdfSignature = new TextDecoder().decode(uint8Array.slice(0, 4));
    if (pdfSignature !== '%PDF') {
      return c.text("corrupted or invalid pdf", 400);
    }

    //9. PDF version validation
    const pdfHeader = new TextDecoder().decode(uint8Array.slice(0, 8));
    if (!pdfHeader.startsWith('%PDF-1.')) {
      return c.text("unsupported pdf version", 400);
    }

    //10. Single metadata extraction - do all checks at once
    let pdfMetadata;
    try {
      pdfMetadata = await extractMetadataAndPages(arrayBuffer);
    } catch (error) {
      return c.text("unable to process pdf", 400);
    }

    //11. All metadata-based validations
    if (pdfMetadata.pages === 0) {
      return c.text("pdf has no pages", 400);
    }
    
    if (pdfMetadata.pages > 500) {
      return c.text("too many pages for printing", 400);
    }

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
