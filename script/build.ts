import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import path from "path";

async function buildAll() {
  const distPath = path.resolve("client", "dist"); // match your serveStatic
  // Remove previous client build
  await rm(distPath, { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();
  console.log("client build completed ✅");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});