import { cpSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";

const distDir = path.resolve("dist");
const clientDir = path.join(distDir, "client");

if (!existsSync(clientDir)) {
  console.log("[postbuild] dist/client not found, skipping copy.");
  process.exit(0);
}

console.log("[postbuild] Copying client assets to dist root for deployment platforms that expect dist/index.html.");

for (const entry of readdirSync(clientDir)) {
  const src = path.join(clientDir, entry);
  const dest = path.join(distDir, entry);
  const stats = statSync(src);

  cpSync(src, dest, { recursive: stats.isDirectory(), force: true });
}

console.log("[postbuild] Copy complete.");
