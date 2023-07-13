<script>
	import Game from '../lib/Game.svelte';

	let levelName = '01_tutorial';
	let playerNames = ['Alex', 'Santa'];
	let playerName = 'Laurent';
	let ready = false;
	// $: ready = playerName == 'Santa';
</script>

<!-- <label for="playerName">Player Selection</label>
<select id="playerName" bind:value={playerName} class="w-50">
	{#each playerNames as playerName}
		<option value={playerName} selected>{playerName}</option>
	{/each}
</select> -->

<!-- <p>{playerName}</p> -->

<!-- {#if ready} -->
<Game {playerName} {levelName} />
<!-- {/if} -->
