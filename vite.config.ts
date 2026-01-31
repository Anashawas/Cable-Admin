/** @type {import('vite').UserConfig} */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path, { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const version = env.VITE_APP_VERSION || "v0.0.0";
  const environment = env.VITE_APP_ENVIRONMENT || mode;

  const safeFolderName = `KM-Camping-Admin-${version.replace(
    /\s+/g,
    "-"
  )}-${environment}`;

  return {
    plugins: [react()],

    ...(env.BASE_URL && { base: env.BASE_URL }),

    logLevel: "warn",
    resolve: {
      alias: {
        src: `${__dirname}/src`,
        "@": resolve(__dirname, "./src"),
      },
    },

    server: {
      host: "127.0.0.1",
      port: 3000,
      open: true,
    },

    build: {
      outDir: `./build/${safeFolderName}`,
      chunkSizeWarningLimit: 2600,
    },
  };
});
