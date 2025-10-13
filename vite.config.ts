await import("./vite.polyfills.js");
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const { cloudflare } = await import("@cloudflare/vite-plugin");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const resolvedPublishableKey =
    env.VITE_CLERK_PUBLISHABLE_KEY || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  const inspectorDisabledValue =
    env.VITE_CLOUDFLARE_INSPECTOR_DISABLED ?? env.CLOUDFLARE_INSPECTOR_DISABLED ?? "";
  const inspectorDisabled = /^(1|true|yes|on)$/i.test(inspectorDisabledValue.trim());

  const inspectorPortValue = env.VITE_CLOUDFLARE_INSPECTOR_PORT ?? env.CLOUDFLARE_INSPECTOR_PORT;
  const parsedInspectorPort = Number.parseInt(inspectorPortValue ?? "", 10);
  const inspectorPort = Number.isInteger(parsedInspectorPort) && parsedInspectorPort > 0
    ? parsedInspectorPort
    : undefined;

  const cloudflareOptions: Record<string, unknown> = {};

  if (inspectorDisabled) {
    cloudflareOptions.inspectorPort = false;
  } else if (inspectorPort !== undefined) {
    cloudflareOptions.inspectorPort = inspectorPort;
  }

  return {
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(resolvedPublishableKey),
      "import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || resolvedPublishableKey,
      ),
    },
    plugins: [
      react(),
      cloudflare(cloudflareOptions),
    ],
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
