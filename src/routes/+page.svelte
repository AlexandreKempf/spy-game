<script>
	import Game from '../lib/Game.svelte';

	let playerNames = import.meta.glob('../../static/players/*.webp');
	playerNames = Object.keys(playerNames).map((path) => path.split('/').reverse()[0].split('.')[0]);

	let levelNames = import.meta.glob('../../static/levels/*/*');
	levelNames = Object.keys(levelNames).map((path) => path.split('/').reverse()[1]);
	levelNames = [...new Set(levelNames)];

	let levelName = '01_tutorial';
	let playerName = 'Laurent';
	let lightOn = true;
	let ready = false;
</script>

<div class="flex space-x-10 items-center">
	<div>
		<label for="playerName">Pick a player</label>
		<select id="playerName" bind:value={playerName} class="w-50">
			{#each playerNames as playerName}
				<option value={playerName} selected>{playerName}</option>
			{/each}
		</select>
	</div>
	<div>
		<label for="levelName">Pick a level</label>
		<select id="levelName" bind:value={levelName} class="w-50">
			{#each levelNames as levelName}
				<option value={levelName} selected>{levelName}</option>
			{/each}
		</select>
	</div>
	<button on:click={() => (lightOn = !lightOn)} class="w-50 h-15">Light</button>
</div>

{#key playerName}
	{#key levelName}
		<Game {playerName} {levelName} {lightOn} />
	{/key}
{/key}
