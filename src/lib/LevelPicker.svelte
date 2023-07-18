<script lang="ts">
	export let multiStore;

	let levelNames = Object.keys(import.meta.glob('../../static/levels/*/*')).map(
		(path) => path.split('/').reverse()[1]
	);
	levelNames = [...new Set(levelNames)];
	$multiStore.users[$multiStore.username].victory = false;
	$multiStore.users[$multiStore.username].multiplayerScreen = false;
</script>

<h1 class="text-center text-7xl mt-3">The Spy Game</h1>

{#if $multiStore.users[$multiStore.username].master}
	<div class="flex items-center mx-30 mt-10">
		<div class="w-20 flex-1" />
		<button
			class="w-30 mr-20 border-none font-bold"
			style:background-color={$multiStore.users[$multiStore.username].color}
			on:click={() => ($multiStore.common.state = 'running')}
			>Play
		</button>
	</div>

	<p class="mx-10 text-lg mx-30 font-bold">Pick a level:</p>
	<div class="grid grid-cols-5 place-items-center mx-25">
		{#each levelNames as levelName}
			{#if levelName == $multiStore.common.level}
				<div
					style:border-color={$multiStore.users[$multiStore.username].color}
					class="flex flex-col items-center w-40 p5 mt-2 rounded-xl border-4 border-solid"
				>
					<div
						style:width="96px"
						style:height="96px"
						style:background="url({`levels/${levelName}/goalObject.webp`})"
					/>
					<p
						style:color={$multiStore.users[$multiStore.username].color}
						class="m-1 text-lg text-#4280dd font-bold"
					>
						{levelName}
					</p>
				</div>
			{:else}
				<div
					class="flex flex-col items-center w-40 p5 mt-2 rounded-xl border-4 bg-#fff border-#fff border-solid"
					role="button"
					on:click={() => {
						$multiStore.common.level = levelName;
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
{:else}
	<p class="mx-10 text-lg mx-30 font-bold">Levels:</p>
	<div class="grid grid-cols-5 place-items-center mx-25">
		{#each levelNames as levelName}
			{#if levelName == $multiStore.common.level}
				<div
					style:border-color={$multiStore.users[$multiStore.username].color}
					class="flex flex-col items-center w-40 p5 mt-2 rounded-xl border-4 border-solid"
				>
					<div
						style:width="96px"
						style:height="96px"
						style:background="url({`levels/${levelName}/goalObject.webp`})"
					/>
					<p
						style:color={$multiStore.users[$multiStore.username].color}
						class="m-1 text-lg text-#4280dd font-bold"
					>
						{levelName}
					</p>
				</div>
			{:else}
				<div
					class="flex flex-col items-center w-40 p5 mt-2 rounded-xl border-4 bg-#fff border-#fff border-solid"
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
{/if}
