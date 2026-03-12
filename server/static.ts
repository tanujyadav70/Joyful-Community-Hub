import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
 const __dirname = process.cwd();
 const distPath = path.resolve(__dirname, "client/dist");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve uploaded files
  const uploadsPath = path.resolve(__dirname, "uploads");
  app.use("/uploads", express.static(uploadsPath));

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
