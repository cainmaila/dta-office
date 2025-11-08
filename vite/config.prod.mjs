import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";

const MESSAGE_INTERVAL_MS = 1000000;
const lastMessageTime = process.env.LAST_MESSAGE_TIME || 0;

const now = Date.now();

if (now - lastMessageTime > MESSAGE_INTERVAL_MS) {
    process.stdout.write(`Building for production...\n`);
    const line = "---------------------------------------------------------";
    const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
    process.stdout.write(`${line}\n${msg}\n${line}\n`);
    process.env.LAST_MESSAGE_TIME = now;
}

export default defineConfig({
    base: "/dta-office/",
    plugins: [
        sveltekit(),
        SvelteKitPWA({
            strategies: "generateSW",
            manifest: {
                name: "靠北DTA",
                short_name: "Funking DTA",
                description: "一個讓DTA員工可以匿名發表意見的地方",
                theme_color: "#ce0000",
                background_color: "#000000",
                display: "fullscreen",
                scope: "/",
                start_url: "/",
                orientation: "landscape-primary",
                icons: [
                    {
                        src: "/dta-office/icon/192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/dta-office/icon/512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any",
                    },
                ],
            },
        }),
    ],
    logLevel: "error",
    build: {
        minify: "terser",
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // 將 Phaser 分離成獨立 chunk
                    if (id.includes("node_modules/phaser")) {
                        return "phaser";
                    }
                    // 將其他 node_modules 分離為 vendor
                    if (id.includes("node_modules")) {
                        return "vendor";
                    }
                },
            },
        },
        terserOptions: {
            compress: {
                passes: 2,
                drop_console: true, // 移除 console.log
                drop_debugger: true, // 移除 debugger
            },
            mangle: true,
            format: {
                comments: false,
            },
        },
    },
});
