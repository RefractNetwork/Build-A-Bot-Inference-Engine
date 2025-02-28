import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import viteCompression from "vite-plugin-compression";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const envDir = path.resolve(__dirname, "..");
    const env = loadEnv(mode, envDir, "");
    return {
        plugins: [
            react(),
            viteCompression({
                algorithm: "brotliCompress",
                ext: ".br",
                threshold: 1024,
            }),
        ],
        clearScreen: false,
        envDir,
        define: {
            "import.meta.env.VITE_SERVER_PORT": JSON.stringify(
                env.SERVER_PORT || "3000"
            ),
            "import.meta.env.VITE_BAB_PACKAGE_ID": JSON.stringify(
                env.BAB_PACKAGE_ID || ""
            ),
            "import.meta.env.VITE_BAB_NETWORK": JSON.stringify(
                env.BAB_NETWORK || ""
            ),
            "import.meta.env.VITE_ELIZA_BE": JSON.stringify(env.ELIZA_BE || ""),
            "import.meta.env.VITE_BE": JSON.stringify(env.BE || ""),
        },
        build: {
            outDir: "dist",
            minify: true,
            cssMinify: true,
            sourcemap: false,
            cssCodeSplit: true,
        },
        resolve: {
            alias: {
                "@": "/src",
            },
        },
        server: {
            allowedHosts: ["eliza.charlesji.com"],
        },
    };
});
