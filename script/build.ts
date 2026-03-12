import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import path from "path";

async function buildAll() {
  // Remove previous build
  // Keep output in sync with `vite.config.ts` (`build.outDir`) and server static hosting.
  await rm(path.resolve("client", "dist"), { recursive: true, force: true });

  console.log("building client...");
  await viteBuild({
    // Ensure the build uses the repo's Vite config (aliases/plugins/etc.).
    // `vite.config.ts` already sets `root: "client"` and `build.outDir`.
    configFile: path.resolve("vite.config.ts"),
    mode: "production",
  });

  console.log("client build completed ✅");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});