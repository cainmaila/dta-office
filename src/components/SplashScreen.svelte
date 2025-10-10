<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    export let onComplete: () => void;

    let show = true;
    let text = "靠北DTA";
    let displayText = "";
    let currentIndex = 0;

    onMount(() => {
        // 播放開場音效
        const audio = new Audio("/sound/start.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {
            // 如果自動播放被阻擋，靜默處理
        });

        // 打字機效果
        const typewriterInterval = setInterval(() => {
            if (currentIndex < text.length) {
                displayText += text[currentIndex];
                currentIndex++;
            } else {
                clearInterval(typewriterInterval);
                // 打字完成後停留一下再淡出
                setTimeout(() => {
                    show = false;
                    setTimeout(onComplete, 300); // 等待淡出動畫完成
                }, 1000);
            }
        }, 150); // 每個字出現的間隔（調整以符合2秒總時長）

        return () => {
            clearInterval(typewriterInterval);
        };
    });
</script>

{#if show}
    <div class="splash-screen" transition:fade={{ duration: 300 }}>
        <div class="content">
            <h1 class="title pixel-text">
                {displayText}<span class="cursor">_</span>
            </h1>
            <div class="subtitle pixel-text">一起來靠北</div>
        </div>
        <div class="scanlines"></div>
    </div>
{/if}

<style>
    .splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        overflow: hidden;
    }

    .content {
        text-align: center;
        position: relative;
        z-index: 2;
        animation: glitch 3s infinite;
    }

    .pixel-text {
        font-family: "Courier New", "Press Start 2P", monospace;
        text-shadow:
            2px 2px 0px #00ff00,
            4px 4px 0px rgba(0, 255, 0, 0.5),
            0 0 20px #00ff00;
        letter-spacing: 0.1em;
    }

    .title {
        font-size: 4rem;
        color: #00ff00;
        margin: 0;
        padding: 0;
        font-weight: bold;
        animation: pulse 1.5s ease-in-out infinite;
    }

    .cursor {
        animation: blink 0.7s infinite;
        color: #00ff00;
    }

    .subtitle {
        font-size: 1rem;
        color: #00ffff;
        margin-top: 1.5rem;
        opacity: 0;
        animation: fadeIn 0.5s ease-in forwards 1.2s;
    }

    .scanlines {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
        );
        pointer-events: none;
        z-index: 1;
        animation: scan 8s linear infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
            filter: brightness(1);
        }
        50% {
            transform: scale(1.05);
            filter: brightness(1.2);
        }
    }

    @keyframes blink {
        0%,
        49% {
            opacity: 1;
        }
        50%,
        100% {
            opacity: 0;
        }
    }

    @keyframes fadeIn {
        to {
            opacity: 0.8;
        }
    }

    @keyframes scan {
        0% {
            transform: translateY(0);
        }
        100% {
            transform: translateY(10px);
        }
    }

    @keyframes glitch {
        0%,
        90%,
        100% {
            transform: translate(0);
        }
        92% {
            transform: translate(-2px, 2px);
        }
        94% {
            transform: translate(2px, -2px);
        }
        96% {
            transform: translate(-2px, -2px);
        }
        98% {
            transform: translate(2px, 2px);
        }
    }

    /* 響應式設計 */
    @media (max-width: 768px) {
        .title {
            font-size: 2.5rem;
        }
        .subtitle {
            font-size: 0.8rem;
        }
    }

    @media (max-width: 480px) {
        .title {
            font-size: 2rem;
        }
        .subtitle {
            font-size: 0.7rem;
        }
    }
</style>
