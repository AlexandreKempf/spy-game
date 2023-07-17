<script lang="ts">
	import { gameInfo, playerInfo } from './store.js';

	let levelNames = Object.keys(import.meta.glob('../../static/levels/*/*')).map(
		(path) => path.split('/').reverse()[1]
	);
	levelNames = [...new Set(levelNames)];
</script>

<h1 class="text-center text-7xl mt-3">The Spy Game</h1>

<div class="flex items-center mx-30 mt-10">
	<div class="w-20 flex-1" />
	<button
		class="w-30 mr-20 border-none font-bold"
		style:background-color={$playerInfo.color}
		on:click={() => ($gameInfo.state = 'running')}
		>Play
	</button>
</div>

<p class="mx-10 text-lg mx-30 font-bold">Pick a level:</p>
<div class="grid grid-cols-5 place-items-center mx-25">
	{#each levelNames as levelName}
		{#if $gameInfo.level == levelName}
			<div
				style:border-color={$playerInfo.color}
				class="flex flex-col items-center w-40 p5 mt-2 rounded-xl border-4 border-solid"
			>
				<div
					style:width="96px"
					style:height="96px"
					style:background="url({`levels/${levelName}/goalObject.webp`})"
				/>
				<p style:color={$playerInfo.color} class="m-1 text-lg text-#4280dd font-bold">
					{levelName}
				</p>
			</div>
		{:else}
			<div
				class="flex flex-col items-center w-40 p5 mt-2 rounded-xl border-4 bg-#fff border-#fff border-solid"
				role="button"
				on:click={() => {
					$gameInfo.level = levelName;
				}}
			>
				<div
					style:width="96px"
					style:height="96px"
					style:background="url({`levels/${levelName}/goalObject.webp`})"
				/>
				<p class="m-1 text-#444 text-lg">
					{levelName}
				</p>
			</div>
		{/if}
	{/each}
</div>
