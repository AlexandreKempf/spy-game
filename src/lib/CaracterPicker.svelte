<script lang="ts">
	import ColorPicker from 'svelte-awesome-color-picker';

	export let multiStore;

	let caracterPaths = Object.keys(import.meta.glob('../../static/players/*_portrait.webp')).map(
		(path) => {
			return {
				path: path.replace('../../static/', ''),
				skin: path.split('/').reverse()[0].split('_')[0]
			};
		}
	);

	let hex: string;
	let isOpen: bool;
	$: if (!isOpen && $multiStore.users[$multiStore.username].color != hex)
		$multiStore.users[$multiStore.username].color = hex;
</script>

<h1 class="text-center text-7xl mt-3">The Spy Game</h1>

<div class="flex mx-30">
	{#each Object.entries($multiStore.users) as [username, user]}
		<div class="flex flex-col items-center w-30 p5 mt-2">
			<div
				style:width="48px"
				style:height="96px"
				style:background="url({`players/${user.skin}_portrait.webp`}) -{48 * 3}px -10px"
			/>
			<p style:color={user.color} class="text-lg">{username}</p>
		</div>
	{/each}
</div>

<div class="flex items-center mx-30">
	<p class="h-10 text-lg font-bold">Pick a color:</p>

	<div class="w-10 h-10 ml-5">
		<ColorPicker bind:hex bind:isOpen isAlpha={false} label="" canChangeMode={false} />
	</div>
	<div class="w-20 flex-1" />
	{#if $multiStore.users[$multiStore.username].master}
		<button
			class="w-30 mr-20 border-none font-bold"
			style:background-color={hex}
			on:click={() => {
				$multiStore.common.state = 'levelSelection';
			}}
			>Play
		</button>
	{/if}
</div>

<p class="mx-10 text-lg mx-30 font-bold">Pick a skin:</p>
<div class="grid grid-cols-9 place-items-center mx-25">
	{#each caracterPaths as { path, skin }}
		{#if $multiStore.users[$multiStore.username].skin == skin}
			<div
				style:border-color={hex}
				class="flex flex-col items-center w-30 p5 mt-2 rounded-xl border-4 border-solid"
			>
				<div
					style:width="48px"
					style:height="96px"
					style:background="url({path}) -{48 * 3}px -10px"
				/>
			</div>
		{:else}
			<div
				class="flex flex-col items-center w-35 p5 mt-2 rounded-xl border-4 bg-#fff border-#fff border-solid"
				role="button"
				on:click={() => {
					$multiStore.users[$multiStore.username].skin = skin;
				}}
			>
				<div
					style:width="48px"
					style:height="96px"
					style:background="url({path}) -{48 * 3}px -10px"
				/>
			</div>
		{/if}
	{/each}
</div>
