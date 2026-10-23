var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/** @type {import('vite').UserConfig} */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    var version = env.VITE_APP_VERSION || "v0.0.0";
    var environment = env.VITE_APP_ENVIRONMENT || mode;
    var safeFolderName = "Cable-Admin-".concat(version.replace(/\s+/g, "-"), "-").concat(environment);
    return __assign(__assign({ plugins: [react()] }, (env.BASE_URL && { base: env.BASE_URL })), { logLevel: "warn", resolve: {
            alias: {
                src: "".concat(__dirname, "/src"),
                "@": resolve(__dirname, "./src"),
            },
        }, server: {
            host: "127.0.0.1",
            port: 3000,
            open: true,
            watch: {
                ignored: ["**/build/**", "**/node_modules/**", "**/.git/**"],
            },
        }, build: {
            outDir: "./build/".concat(safeFolderName),
            chunkSizeWarningLimit: 2600,
            rollupOptions: {
                output: {
                    manualChunks: undefined,
                },
            },
        } });
});
