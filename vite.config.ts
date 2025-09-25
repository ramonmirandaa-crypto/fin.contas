/**
 * Dockploy's Nixpacks image currently defaults to Node 18, which does not ship the
 * `File` constructor by default. React Router 7 pulls in Undici, which expects the
 * global to exist even during build time. This lightweight polyfill is only used
 * when the real implementation is missing so that `vite build` can run under Node 18.
 */
type BlobLike = {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start?: number, end?: number, contentType?: string): BlobLike;
  stream(): unknown;
  text(): Promise<string>;
};

type BlobConstructor = new (...args: unknown[]) => BlobLike;

if (typeof (globalThis as Record<string, unknown>).File === "undefined") {
  const BlobCtor = (globalThis as { Blob?: BlobConstructor }).Blob;

  if (BlobCtor) {
    class NodeFile extends BlobCtor {
      name: string;
      lastModified: number;

      constructor(
        fileBits: unknown[] = [],
        fileName = "",
        options: { lastModified?: number } = {},
      ) {
        super(fileBits, options);
        this.name = fileName;
        this.lastModified = options.lastModified ?? Date.now();
      }

      get [Symbol.toStringTag]() {
        return "File";
      }
    }

    (globalThis as Record<string, unknown>).File = NodeFile;
  }
}

import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
