await import("./vite.polyfills.js");
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const { cloudflare } = await import("@cloudflare/vite-plugin");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const resolvedPublishableKey =
    env.VITE_CLERK_PUBLISHABLE_KEY || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  return {
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(resolvedPublishableKey),
      "import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || resolvedPublishableKey,
      ),
    },
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
  };
});
