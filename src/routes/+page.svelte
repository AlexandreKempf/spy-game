<script lang="ts">
	import { number } from 'mathjs';
	import Game from '../lib/Game.svelte';

	let playerNames = import.meta.glob('../../static/players/*.webp');
	playerNames = Object.keys(playerNames).map((path) => path.split('/').reverse()[0].split('.')[0]);

	let levelNames = import.meta.glob('../../static/levels/*/*');
	levelNames = Object.keys(levelNames).map((path) => path.split('/').reverse()[1]);
	levelNames = [...new Set(levelNames)];

	let levelName = '01_tutorial';
	let playerName = 'Laurent';
	let playerColor: [number, number, number, number] = [255, 255, 255, 255];
	let lightOn = true;
	let ready = false;
	$: goalPath = `levels/${levelName}/goalObject.webp`;
</script>

<article data-theme={lightOn ? 'light' : 'dark'} class="h-screen w-screen mt-0 fixed">
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
		<button on:click={() => (lightOn = !lightOn)} class="w-50 h-15"
			>{lightOn ? 'Night' : 'Day'}</button
		>
	</div>

	{#key levelName}
		<div class="flex space-x-5 items-center">
			<p class="text-lg">You need to steal this object:</p>
			<img src={goalPath} alt="object to steal" />
		</div>
		<p>Explore the museum by day, and when you're ready comes by night to steal it.</p>
		<p>
			In order to steal it, you need to go in front of the object, stand still, press "X" and then
			sneak back to the entrance of the museum
		</p>

		<div class="grid h-10 place-items-center">
			{#key playerName}
				{#key lightOn}
					<Game {playerName} {playerColor} {levelName} {lightOn} />
				{/key}
			{/key}
		</div>
	{/key}
</article>
