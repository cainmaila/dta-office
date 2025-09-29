<script lang="ts">
    import type { Scene } from 'phaser';
    import PhaserGame, { type TPhaserRef } from '../PhaserGame.svelte';

    //  References to the PhaserGame component (game and scene are exposed)
    let phaserRef: TPhaserRef = { game: null, scene: null};
</script>

<div id="app">
    <PhaserGame bind:phaserRef={phaserRef} />
</div>

<style>
    #app {
        width: 100%;
        height: 100vh;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000000;
    }
</style>
