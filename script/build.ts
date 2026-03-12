import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

async function buildAll() {
  // Remove previous build
  await rm("dist", { recursive: true, force: true });

  // Build the client
  console.log("building client...");
  await viteBuild();

  console.log("client build completed ✅");
}

// Run the build
buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});