import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";

const MESSAGE_INTERVAL_MS = 1000000;
const lastMessageTime = process.env.LAST_MESSAGE_TIME || 0;

const now = Date.now();

if (now - lastMessageTime > MESSAGE_INTERVAL_MS) {
    process.stdout.write(`Building for production...\n`);
    const line = "---------------------------------------------------------";
    const msg = `❤️❤️❤️ Fucking DTA ❤️❤️❤️`;
    process.stdout.write(`${line}\n${msg}\n${line}\n`);
    process.env.LAST_MESSAGE_TIME = now;
}

export default defineConfig({
    base: "/dta-office/",
    plugins: [
        sveltekit(),
        SvelteKitPWA({
            strategies: "generateSW",
            workbox: {
                // Runtime Caching 策略
                runtimeCaching: [
                    {
                        // API 快取策略：優先網路，失敗時使用快取
                        urlPattern:
                            /^https:\/\/line-boot.*\.vercel\.app\/api\/.*/,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 3600, // 1 小時
                            },
                            networkTimeoutSeconds: 10,
                        },
                    },
                    {
                        // 圖片快取策略：優先快取，背景更新
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "image-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
                            },
                        },
                    },
                    {
                        // 音效快取策略
                        urlPattern: /\.(?:mp3|wav|ogg)$/,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "audio-cache",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
                            },
                        },
                    },
                ],
            },
            manifest: {
                name: "靠北DTA",
                short_name: "Fucking DTA",
                description: "一個讓DTA員工可以匿名發表意見的地方",
                theme_color: "#ce0000",
                background_color: "#000000",
                display: "standalone", // 改為 standalone，像原生 App 但保留系統狀態列
                scope: "/dta-office/",
                start_url: "/dta-office/",
                orientation: "any", // 改為支援任何方向
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
                    {
                        src: "/dta-office/icon/512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable", // 新增 maskable 版本（Android 適配）
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
