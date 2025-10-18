<svelte:head>
    <title>靠北DTA v2.4</title>
    <meta
        name="description"
        content="DTA 辦公室互動遊戲 - 與團隊成員進行有趣的對話互動"
    />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="靠杯DTA" />
    <meta
        property="og:description"
        content="DTA 辦公室互動遊戲 - 與團隊成員進行有趣的對話互動"
    />
    <meta property="og:image" content="/dta-office/logo.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="靠杯DTA" />
    <meta
        name="twitter:description"
        content="DTA 辦公室互動遊戲 - 與團隊成員進行有趣的對話互動"
    />
    <meta name="twitter:image" content="/dta-office/logo.png" />
</svelte:head>

<slot />

<style>
    :global(body) {
        background-color: #0cc9bd;
        margin: 0;
        padding: 0;
        color: rgba(255, 255, 255, 0.87);
        background-color: #000000;
        font-family: Arial, Helvetica, sans-serif;
    }
</style>
