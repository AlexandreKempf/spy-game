<script lang="ts">
	import ColorPicker from 'svelte-awesome-color-picker';
	import { gameInfo, playerInfo } from '../lib/store.js';

	let caracterPaths = Object.keys(import.meta.glob('../../static/players/*_portrait.webp')).map(
		(path) => {
			return {
				path: path.replace('../../static/', ''),
				name: path.split('/').reverse()[0].split('_')[0]
			};
		}
	);

	let hex: string;
	$: $playerInfo.color = hex;
</script>

<h1 class="text-center text-7xl mt-3">The Spy Game</h1>

<div class="flex items-center mx-30 mt-10">
	<p class="h-10 text-lg font-bold">Pick a color:</p>

	<div class="w-10 h-10 ml-5">
		<ColorPicker bind:hex isAlpha={false} label="" canChangeMode={false} />
	</div>
	<div class="w-20 flex-1" />
	<button
		class="w-30 mr-20 border-none font-bold"
		style:background-color={hex}
		on:click={() => ($gameInfo.state = 'levelSelection')}
		>Play
	</button>
</div>

<p class="mx-10 text-lg mx-30 font-bold">Pick a caracter:</p>
<div class="grid grid-cols-9 place-items-center mx-25">
	{#each caracterPaths as { path, name }}
		{#if $playerInfo.name == name}
			<div
				style:border-color={hex}
				class="flex flex-col items-center w-30 p5 mt-2 rounded-xl border-4 border-solid"
			>
				<div
					style:width="48px"
					style:height="96px"
					style:background="url({path}) -{48 * 3}px -10px"
				/>
				<p style:color={hex} class="m-1 text-lg text-#4280dd font-bold">{name}</p>
			</div>
		{:else}
			<div
				class="flex flex-col items-center w-35 p5 mt-2 rounded-xl border-4 bg-#fff border-#fff border-solid"
				role="button"
				on:click={() => {
					$playerInfo.name = name;
				}}
			>
				<div
					style:width="48px"
					style:height="96px"
					style:background="url({path}) -{48 * 3}px -10px"
				/>
				<p class="m-1 text-#444 text-lg">{name}</p>
			</div>
		{/if}
	{/each}
</div>
