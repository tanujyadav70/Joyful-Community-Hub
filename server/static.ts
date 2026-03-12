import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Use current working directory
  const __dirname = process.cwd();

  // Match the output folder of your Vite build
  const distPath = path.resolve(__dirname, "dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve uploaded files
  const uploadsPath = path.resolve(__dirname, "uploads");
  app.use("/uploads", express.static(uploadsPath));

  // Serve frontend static files
  app.use(express.static(distPath));

  // Fall back to index.html for SPA routing
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}